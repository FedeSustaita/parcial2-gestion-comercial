import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { usuarioDeSesion, type UsuarioSesion } from "@/services/auth";
import { COOKIE_SESION, DURACION_SESION_SEG, firmarSesion, verificarSesion } from "./session";

// Manejo de la cookie de sesión para los adaptadores (páginas, Route Handlers
// y Server Actions). Cookie httpOnly + SameSite=Lax (sección 11.1).

export async function abrirSesion(usuarioId: number): Promise<void> {
  const token = await firmarSesion(usuarioId);
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
}

/**
 * Usuario conectado o null. Verifica la firma de la cookie y lo busca en la
 * base en cada pedido (un usuario desactivado pierde el acceso al instante).
 * `cache` evita repetir la consulta dentro del mismo render.
 */
export const obtenerUsuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  const id = await verificarSesion(token);
  return id ? usuarioDeSesion(id) : null;
});

/** Segunda barrera (sección 10.5): cada página comprueba que haya usuario válido. */
export async function requerirUsuario(): Promise<UsuarioSesion> {
  const u = await obtenerUsuarioActual();
  if (!u) redirect("/login");
  return u;
}

/** Para páginas solo de administrador (p. ej. /usuarios). */
export async function requerirAdmin(): Promise<UsuarioSesion> {
  const u = await requerirUsuario();
  if (u.rol !== "admin") redirect("/");
  return u;
}
