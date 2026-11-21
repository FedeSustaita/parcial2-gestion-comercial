import { ruta } from "@/lib/api";
import { actualizarUsuario } from "@/services/usuarios";

// PATCH /api/usuarios/{id} — RF-U4 (admin).
export const PATCH = ruta(async ({ usuario, params, body }) => actualizarUsuario(usuario, params.id, body));
