import { ruta } from "@/lib/api";
import { listarMovimientos } from "@/services/stock";

// GET /api/movimientos-stock — RF-P6. Filtros: productoId, tipo, desde, hasta.
export const GET = ruta(async ({ usuario, query }) => listarMovimientos(usuario, query));
