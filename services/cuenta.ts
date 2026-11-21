import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db, type DBoTx } from "@/db";
import { movimientosCuenta } from "@/db/schema";
import { finDiaAR, inicioDiaAR } from "@/lib/fechas";

// Cuenta corriente: el saldo tiene UNA sola fuente de verdad, los movimientos
// (sección 10.2). Saldo = Σ débitos − Σ créditos (regla 7). No se guarda en
// ningún otro lado, así que siempre coincide con sus movimientos.

/** Expresión SQL del importe con signo: débito suma, crédito resta. */
export const importeConSigno = sql<number>`case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end`;

/** Regla 7: saldo actual del cliente (en centavos). */
export async function saldoCliente(tx: DBoTx, clienteId: number): Promise<number> {
  const [{ saldo }] = await tx
    .select({ saldo: sql<number>`coalesce(sum(${importeConSigno}), 0)` })
    .from(movimientosCuenta)
    .where(eq(movimientosCuenta.clienteId, clienteId));
  return Number(saldo);
}

/** Saldo acumulado hasta un movimiento (inclusive), para reimprimir recibos. */
export async function saldoHastaMovimiento(clienteId: number, movimientoId: number): Promise<number> {
  const [{ saldo }] = await db
    .select({ saldo: sql<number>`coalesce(sum(${importeConSigno}), 0)` })
    .from(movimientosCuenta)
    .where(and(eq(movimientosCuenta.clienteId, clienteId), lte(movimientosCuenta.id, movimientoId)));
  return Number(saldo);
}

/** Registra un movimiento de cuenta corriente (débito por venta, crédito por pago o anulación). */
export async function registrarMovimientoCuenta(
  tx: DBoTx,
  mov: {
    clienteId: number;
    tipo: "debito" | "credito";
    importe: number;
    descripcion: string;
    facturaId?: number | null;
    pagoId?: number | null;
  },
) {
  if (!Number.isInteger(mov.importe) || mov.importe <= 0) throw new Error("Importe de cuenta inválido");
  const [m] = await tx
    .insert(movimientosCuenta)
    .values({ ...mov, facturaId: mov.facturaId ?? null, pagoId: mov.pagoId ?? null })
    .returning();
  return m;
}

export type MovimientoCuentaPublico = {
  id: number;
  fecha: string;
  tipo: "debito" | "credito";
  importe: number;
  descripcion: string;
  facturaId: number | null;
  pagoId: number | null;
  saldo: number; // acumulado en este renglón
};

/**
 * RF-C4: movimientos en orden cronológico con el saldo acumulado en cada
 * renglón. Si `desde` corta el historial, `saldoAnterior` trae lo acumulado
 * hasta ese día.
 */
export async function movimientosConSaldo(
  clienteId: number,
  filtro: { desde?: string; hasta?: string },
): Promise<{ saldoAnterior: number; movimientos: MovimientoCuentaPublico[]; saldo: number }> {
  let saldoAnterior = 0;
  if (filtro.desde) {
    const [r] = await db
      .select({ s: sql<number>`coalesce(sum(${importeConSigno}), 0)` })
      .from(movimientosCuenta)
      .where(and(eq(movimientosCuenta.clienteId, clienteId), lt(movimientosCuenta.fecha, inicioDiaAR(filtro.desde))));
    saldoAnterior = Number(r.s);
  }

  const filas = await db
    .select()
    .from(movimientosCuenta)
    .where(
      and(
        eq(movimientosCuenta.clienteId, clienteId),
        filtro.desde ? gte(movimientosCuenta.fecha, inicioDiaAR(filtro.desde)) : undefined,
        filtro.hasta ? lt(movimientosCuenta.fecha, finDiaAR(filtro.hasta)) : undefined,
      ),
    )
    .orderBy(asc(movimientosCuenta.fecha), asc(movimientosCuenta.id));

  let saldo = saldoAnterior;
  const movimientos = filas.map((m) => {
    saldo += m.tipo === "debito" ? m.importe : -m.importe;
    return {
      id: m.id,
      fecha: m.fecha.toISOString(),
      tipo: m.tipo,
      importe: m.importe,
      descripcion: m.descripcion,
      facturaId: m.facturaId,
      pagoId: m.pagoId,
      saldo,
    };
  });
  return { saldoAnterior, movimientos, saldo };
}
