import { ruta } from "@/lib/api";
import { crearProducto, listarProductos } from "@/services/productos";

// GET /api/productos — RF-P1 (ambos). POST — RF-P2 (admin).
export const GET = ruta(async ({ usuario, query }) => listarProductos(usuario, query));
export const POST = ruta(async ({ usuario, body }) => crearProducto(usuario, body), { status: 201 });
