import { ruta } from "@/lib/api";
import { crearUsuario, listarUsuarios } from "@/services/usuarios";

// GET/POST /api/usuarios — RF-U4 (admin; el rol lo verifica el servicio).
export const GET = ruta(async ({ usuario, query }) => listarUsuarios(usuario, query));
export const POST = ruta(async ({ usuario, body }) => crearUsuario(usuario, body), { status: 201 });
