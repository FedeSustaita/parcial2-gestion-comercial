"use server";

import { ejecutarAccion } from "@/lib/action";
import { cambiarPassword } from "@/services/auth";

/** RF-U5: cambio de la propia contraseña. */
export async function cambiarPasswordAction(datos: unknown) {
  return ejecutarAccion((usuario) => cambiarPassword(usuario, datos));
}
