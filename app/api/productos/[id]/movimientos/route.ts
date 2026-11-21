import { ruta } from "@/lib/api";
import { listarMovimientosProducto, registrarMovimientoManual } from "@/services/stock";

// GET — RF-P6 (historial del producto). POST — RF-P4, RF-P5 (ingreso/egreso manual, admin).
export const GET = ruta(async ({ usuario, params, query }) => listarMovimientosProducto(usuario, params.id, query));
export const POST = ruta(async ({ usuario, params, body }) => registrarMovimientoManual(usuario, params.id, body), {
  status: 201,
});
