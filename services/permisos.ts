import { errores } from "@/lib/api-error";
import type { Rol } from "@/db/schema";
import type { UsuarioSesion } from "./auth";

// Verificación de rol (sección 10.5). La llama CADA servicio que tiene
// restricción: ocultar un botón en la interfaz es solo una ayuda visual.
// Un vendedor que llama directo a la API recibe 403 SIN_PERMISO desde acá.
export function exigirRol(usuario: UsuarioSesion, ...roles: Rol[]): void {
  if (!roles.includes(usuario.rol)) throw errores.sinPermiso();
}

export function esAdmin(usuario: UsuarioSesion): boolean {
  return usuario.rol === "admin";
}
