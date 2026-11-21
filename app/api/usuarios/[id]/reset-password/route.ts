import { ruta } from "@/lib/api";
import { restablecerPassword } from "@/services/usuarios";

// POST /api/usuarios/{id}/reset-password — RF-U5 (admin).
export const POST = ruta(async ({ usuario, params }) => restablecerPassword(usuario, params.id));
