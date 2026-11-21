import { ruta } from "@/lib/api";
import { crearCategoria, listarCategorias } from "@/services/categorias";

// GET/POST /api/categorias — RF-P7. GET: activas sin paginar (el admin puede pedir ?todas=true).
export const GET = ruta(async ({ usuario, query }) => listarCategorias(usuario, { todas: query.todas === "true" }));
export const POST = ruta(async ({ usuario, body }) => crearCategoria(usuario, body), { status: 201 });
