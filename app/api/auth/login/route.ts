import { rutaPublica } from "@/lib/api";
import { abrirSesion } from "@/lib/auth";
import { login } from "@/services/auth";

// POST /api/auth/login — RF-U1. Única ruta pública.
export const POST = rutaPublica(async ({ body }) => {
  const usuario = await login(body);
  await abrirSesion(usuario.id);
  return usuario;
});
