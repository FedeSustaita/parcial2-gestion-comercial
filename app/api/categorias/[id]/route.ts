import { ruta } from "@/lib/api";
import { actualizarCategoria } from "@/services/categorias";

// PATCH /api/categorias/{id} — RF-P7 (admin).
export const PATCH = ruta(async ({ usuario, params, body }) => actualizarCategoria(usuario, params.id, body));
