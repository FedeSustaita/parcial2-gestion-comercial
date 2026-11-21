import { ruta } from "@/lib/api";
import { actualizarProducto, obtenerProducto } from "@/services/productos";

// GET /api/productos/{id} — RF-P1. PATCH — RF-P2, RF-P3 (admin; baja lógica con "activo": false).
export const GET = ruta(async ({ usuario, params }) => obtenerProducto(usuario, params.id));
export const PATCH = ruta(async ({ usuario, params, body }) => actualizarProducto(usuario, params.id, body));
