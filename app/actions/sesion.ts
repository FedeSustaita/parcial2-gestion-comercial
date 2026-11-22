"use server";

import { redirect } from "next/navigation";
import { ejecutarAccionPublica } from "@/lib/action";
import { abrirSesion, cerrarSesion } from "@/lib/auth";
import { login, loginDemo } from "@/services/auth";

// Server Actions de sesión. Solo adaptan: llaman al servicio y manejan la cookie.

/** RF-U1: inicio de sesión. */
export async function loginAction(datos: unknown) {
  return ejecutarAccionPublica(async () => {
    const usuario = await login(datos);
    await abrirSesion(usuario.id);
    return usuario;
  });
}

/** Modo demo: entra como administrador o vendedor de prueba sin escribir credenciales. */
export async function loginDemoAction(rol: unknown) {
  return ejecutarAccionPublica(async () => {
    const usuario = await loginDemo(rol);
    await abrirSesion(usuario.id);
    return usuario;
  });
}

/** RF-U1: cierre de sesión. */
export async function logoutAction() {
  await cerrarSesion();
  redirect("/login");
}
