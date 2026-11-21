"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/action";
import { actualizarUsuario, crearUsuario, restablecerPassword } from "@/services/usuarios";

// Server Actions del módulo Usuarios (RF-U4, RF-U5). El rol lo verifica el servicio.

export async function crearUsuarioAction(datos: unknown) {
  return ejecutarAccion(async (u) => {
    const r = await crearUsuario(u, datos);
    revalidatePath("/usuarios");
    return r;
  });
}

export async function actualizarUsuarioAction(id: number, datos: unknown) {
  return ejecutarAccion(async (u) => {
    const r = await actualizarUsuario(u, id, datos);
    revalidatePath("/usuarios");
    return r;
  });
}

export async function restablecerPasswordAction(id: number) {
  return ejecutarAccion((u) => restablecerPassword(u, id));
}
