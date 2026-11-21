import { ruta } from "@/lib/api";
import { cambiarPassword } from "@/services/auth";

// PUT /api/auth/password — RF-U5.
export const PUT = ruta(async ({ usuario, body }) => cambiarPassword(usuario, body), { status: 204 });
