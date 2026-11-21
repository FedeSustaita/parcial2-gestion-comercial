import { and, count, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import { db, type DBoTx } from "@/db";
import { movimientosStock, productos, TIPOS_MOV_STOCK } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { finDiaAR, inicioDiaAR } from "@/lib/fechas";
import { formatearNumeroComprobante } from "@/lib/format";
import { validar } from "@/lib/validacion";
import { listarMovimientosSchema, movimientoManualSchema } from "@/schemas/catalogo";
import type { Paginado } from "@/schemas/comunes";
import type { UsuarioSesion } from "./auth";
import { exigirRol } from "./permisos";

// Servicio de stock. Acá vive el invariante más importante del sistema:
// la existencia de un producto SOLO cambia en moverStock().

type TipoMovStock = (typeof TIPOS_MOV_STOCK)[number];

export type MovimientoStockPublico = {
  id: number;
  producto: { id: number; codigo: string; descripcion: string };
  tipo: TipoMovStock;
  cantidad: number;
  existenciaResultante: number;
  motivo: string;
  observacion: string | null;
  referencia: { facturaId: number; numero: string } | null;
  usuario: { id: number; nombre: string };
  fecha: string;
};

/**
 * Regla 1 y regla 2 / sección 10.2: ÚNICA función que modifica la existencia.
 * La llaman ventas, anulaciones, ingresos y egresos, siempre dentro de una
 * transacción (`tx`), para que la existencia y el movimiento se graben juntos.
 *
 * - `cantidad` lleva signo: positiva entra, negativa sale.
 * - Para salidas, el UPDATE tiene la condición `existencia >= ?`: si otra
 *   operación se llevó las unidades al mismo tiempo, no se modifica ninguna
 *   fila y se aborta con 409 STOCK_INSUFICIENTE. Así dos ventas simultáneas de
 *   la última unidad terminan con una sola confirmada.
 */
export async function moverStock(
  tx: DBoTx,
  mov: {
    productoId: number;
    tipo: TipoMovStock;
    cantidad: number;
    motivo: string;
    observacion?: string | null;
    usuarioId: number;
    facturaId?: number | null;
  },
): Promise<{ movimientoId: number; existenciaResultante: number }> {
  if (!Number.isInteger(mov.cantidad) || mov.cantidad === 0) {
    throw new Error(`moverStock: cantidad inválida (${mov.cantidad})`);
  }

  const condicion =
    mov.cantidad < 0
      ? and(eq(productos.id, mov.productoId), gte(productos.existencia, -mov.cantidad))
      : eq(productos.id, mov.productoId);

  const [actualizado] = await tx
    .update(productos)
    .set({ existencia: sql`${productos.existencia} + ${mov.cantidad}` })
    .where(condicion)
    .returning({ existencia: productos.existencia });

  if (!actualizado) {
    const p = await tx.query.productos.findFirst({ where: eq(productos.id, mov.productoId) });
    if (!p) throw errores.noEncontrado("El producto");
    throw new ApiError(409, "STOCK_INSUFICIENTE", `No hay existencia suficiente de ${p.codigo}.`, [
      { productoId: p.id, codigo: p.codigo, solicitado: -mov.cantidad, disponible: p.existencia },
    ]);
  }

  const [m] = await tx
    .insert(movimientosStock)
    .values({
      productoId: mov.productoId,
      tipo: mov.tipo,
      cantidad: mov.cantidad,
      existenciaResultante: actualizado.existencia,
      motivo: mov.motivo,
      observacion: mov.observacion ?? null,
      usuarioId: mov.usuarioId,
      facturaId: mov.facturaId ?? null,
    })
    .returning({ id: movimientosStock.id });

  return { movimientoId: m.id, existenciaResultante: actualizado.existencia };
}

/**
 * RF-P4 / RF-P5: ingreso o egreso manual (solo admin). El signo lo pone el
 * servidor. Un egreso que dejaría la existencia negativa → 409.
 */
export async function registrarMovimientoManual(
  usuario: UsuarioSesion,
  productoId: unknown,
  datos: unknown,
): Promise<MovimientoStockPublico> {
  const d = validar(movimientoManualSchema, datos);
  exigirRol(usuario, "admin");
  const id = Number(productoId);

  const movimientoId = await db.transaction(async (tx) => {
    const p = await tx.query.productos.findFirst({ where: eq(productos.id, id) });
    if (!p) throw errores.noEncontrado("El producto");
    const r = await moverStock(tx, {
      productoId: id,
      tipo: d.tipo,
      cantidad: d.tipo === "ingreso" ? d.cantidad : -d.cantidad,
      motivo: d.motivo,
      observacion: d.observacion,
      usuarioId: usuario.id,
    });
    return r.movimientoId;
  });

  const [m] = await consultarMovimientos(eq(movimientosStock.id, movimientoId), 1, 0);
  return m;
}

/** RF-P6: historial de un producto, del más nuevo al más viejo. */
export async function listarMovimientosProducto(
  usuario: UsuarioSesion,
  productoId: unknown,
  query: unknown,
): Promise<Paginado<MovimientoStockPublico>> {
  const id = Number(productoId);
  const p = await db.query.productos.findFirst({ where: eq(productos.id, id) });
  if (!p) throw errores.noEncontrado("El producto");
  return listarMovimientos(usuario, { ...(query as object), productoId: id });
}

/** RF-P6: movimientos de todos los productos, con filtros. */
export async function listarMovimientos(
  _usuario: UsuarioSesion,
  query: unknown,
): Promise<Paginado<MovimientoStockPublico>> {
  const f = validar(listarMovimientosSchema, query ?? {});
  const condiciones: SQL[] = [];
  if (f.productoId) condiciones.push(eq(movimientosStock.productoId, f.productoId));
  if (f.tipo) condiciones.push(eq(movimientosStock.tipo, f.tipo));
  if (f.desde) condiciones.push(gte(movimientosStock.fecha, inicioDiaAR(f.desde)));
  if (f.hasta) condiciones.push(lt(movimientosStock.fecha, finDiaAR(f.hasta)));
  const where = condiciones.length ? and(...condiciones) : undefined;

  const [data, [{ total }]] = await Promise.all([
    consultarMovimientos(where, f.pageSize, (f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(movimientosStock).where(where),
  ]);
  return { data, page: f.page, pageSize: f.pageSize, total };
}

async function consultarMovimientos(
  where: SQL | undefined,
  limit: number,
  offset: number,
): Promise<MovimientoStockPublico[]> {
  const filas = await db.query.movimientosStock.findMany({
    where,
    orderBy: [desc(movimientosStock.fecha), desc(movimientosStock.id)],
    limit,
    offset,
    with: {
      producto: { columns: { id: true, codigo: true, descripcion: true } },
      usuario: { columns: { id: true, nombre: true } },
      factura: { columns: { id: true, puntoVenta: true, numero: true } },
    },
  });
  return filas.map((m) => ({
    id: m.id,
    producto: m.producto,
    tipo: m.tipo,
    cantidad: m.cantidad,
    existenciaResultante: m.existenciaResultante,
    motivo: m.motivo,
    observacion: m.observacion,
    referencia: m.factura
      ? { facturaId: m.factura.id, numero: formatearNumeroComprobante(m.factura.puntoVenta, m.factura.numero) }
      : null,
    usuario: m.usuario,
    fecha: m.fecha.toISOString(),
  }));
}
