import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { facturaItems, facturas, FORMAS_PAGO } from "@/db/schema";
import { diaAR, inicioDiaAR, inicioMesAR, sumarDias } from "@/lib/fechas";
import type { UsuarioSesion } from "./auth";
import { resumenCuentasCorrientes } from "./clientes";
import { contarBajoMinimo } from "./productos";

// Tablero de inicio (RF-T1 a RF-T3, sección 11.7). Solo cuenta facturas
// EMITIDAS (las anuladas no suman). Día y mes en hora de Argentina.

export type Tablero = {
  hoy: { cantidad: number; importe: number };
  mes: { cantidad: number; importe: number; ticketPromedio: number };
  cuentasCorrientes: { totalAdeudado: number; clientesConSaldo: number };
  bajoMinimo: { cantidad: number };
  ventasDiarias: { fecha: string; importe: number }[]; // siempre 30, del más viejo a hoy
  porFormaDePago: { forma: (typeof FORMAS_PAGO)[number]; importe: number }[];
  masVendidos: { productoId: number; codigo: string; descripcion: string; unidades: number; importe: number }[];
};

const DIAS = 30;

export async function obtenerTablero(_usuario: UsuarioSesion): Promise<Tablero> {
  const hoy = diaAR();
  const primerDia = sumarDias(hoy, -(DIAS - 1));
  const inicioMes = inicioMesAR();
  // Traemos desde lo que empiece antes: los 30 días o el mes en curso.
  const desde = primerDia < inicioMes ? primerDia : inicioMes;

  const emitidasDesde = and(eq(facturas.estado, "emitida"), gte(facturas.fecha, inicioDiaAR(desde)));

  const [ventas, masVendidos, cuentas, bajoMinimo] = await Promise.all([
    db.select({ fecha: facturas.fecha, total: facturas.total, forma: facturas.formaPago }).from(facturas).where(emitidasDesde),
    // RF-T3: los 5 más vendidos del mes, por unidades.
    db
      .select({
        productoId: facturaItems.productoId,
        codigo: facturaItems.codigo,
        descripcion: facturaItems.descripcion,
        unidades: sql<number>`sum(${facturaItems.cantidad})`,
        importe: sql<number>`sum(${facturaItems.subtotal})`,
      })
      .from(facturaItems)
      .innerJoin(facturas, eq(facturaItems.facturaId, facturas.id))
      .where(and(eq(facturas.estado, "emitida"), gte(facturas.fecha, inicioDiaAR(inicioMes))))
      .groupBy(facturaItems.productoId)
      .orderBy(desc(sql`sum(${facturaItems.cantidad})`))
      .limit(5),
    resumenCuentasCorrientes(),
    contarBajoMinimo(),
  ]);

  // Agrupamos por día de Argentina en el servidor (pocos datos: 30 días).
  const porDia = new Map<string, number>();
  const porForma = new Map<string, number>(FORMAS_PAGO.map((f) => [f, 0]));
  const resumenHoy = { cantidad: 0, importe: 0 };
  const resumenMes = { cantidad: 0, importe: 0 };

  for (const v of ventas) {
    const dia = diaAR(v.fecha);
    porDia.set(dia, (porDia.get(dia) ?? 0) + v.total);
    if (dia === hoy) {
      resumenHoy.cantidad++;
      resumenHoy.importe += v.total;
    }
    if (dia >= inicioMes) {
      resumenMes.cantidad++;
      resumenMes.importe += v.total;
      porForma.set(v.forma, porForma.get(v.forma)! + v.total);
    }
  }

  // RF-T2: siempre 30 elementos, con 0 en los días sin ventas (sin huecos en el gráfico).
  const ventasDiarias = Array.from({ length: DIAS }, (_, i) => {
    const fecha = sumarDias(primerDia, i);
    return { fecha, importe: porDia.get(fecha) ?? 0 };
  });

  return {
    hoy: resumenHoy,
    mes: {
      ...resumenMes,
      ticketPromedio: resumenMes.cantidad ? Math.round(resumenMes.importe / resumenMes.cantidad) : 0,
    },
    cuentasCorrientes: cuentas,
    bajoMinimo: { cantidad: bajoMinimo },
    ventasDiarias,
    porFormaDePago: FORMAS_PAGO.map((forma) => ({ forma, importe: porForma.get(forma)! })),
    masVendidos: masVendidos.map((m) => ({ ...m, unidades: Number(m.unidades), importe: Number(m.importe) })),
  };
}
