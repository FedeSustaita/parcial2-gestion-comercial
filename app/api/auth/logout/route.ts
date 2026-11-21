import { ruta } from "@/lib/api";
import { cerrarSesion } from "@/lib/auth";

// POST /api/auth/logout — RF-U1. Responde 204 y borra la cookie.
export const POST = ruta(async () => cerrarSesion(), { status: 204 });
