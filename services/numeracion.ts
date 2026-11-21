import { eq, max } from "drizzle-orm";
import type { DBoTx } from "@/db";
import { facturas, pagos } from "@/db/schema";

// Numeración correlativa y sin huecos (regla 4).
// - El número se asigna al CONFIRMAR, dentro de la misma transacción que
//   graba el comprobante: si algo falla, se revierte todo y el número no se
//   consume. Por eso no quedan huecos.
// - La transacción de escritura de SQLite/libSQL serializa las escrituras, y
//   el índice único (punto_venta, numero) impide cualquier duplicado.
// - Facturas y recibos tienen numeraciones independientes.

/** Punto de venta del local. Para pasar a "0002" se cambia solo acá. */
export const PUNTO_DE_VENTA = 1;

export async function siguienteNumeroFactura(tx: DBoTx): Promise<number> {
  const [{ ultimo }] = await tx
    .select({ ultimo: max(facturas.numero) })
    .from(facturas)
    .where(eq(facturas.puntoVenta, PUNTO_DE_VENTA));
  return (ultimo ?? 0) + 1;
}

export async function siguienteNumeroRecibo(tx: DBoTx): Promise<number> {
  const [{ ultimo }] = await tx
    .select({ ultimo: max(pagos.numero) })
    .from(pagos)
    .where(eq(pagos.puntoVenta, PUNTO_DE_VENTA));
  return (ultimo ?? 0) + 1;
}
