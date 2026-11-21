import "server-only";
import type { UsuarioSesion } from "@/services/auth";
import { aErrorPublico, errores, type ErrorPublico } from "./api-error";
import { obtenerUsuarioActual } from "./auth";

// Envoltorio común de las Server Actions (sección 10.3). En lugar de lanzar,
// devuelve { ok, data } o { ok: false, error } para que el formulario pueda
// mostrar cada error junto a su campo.

export type ResultadoAccion<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorPublico };

export async function ejecutarAccion<T>(
  fn: (usuario: UsuarioSesion) => Promise<T>,
): Promise<ResultadoAccion<T>> {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw errores.noAutenticado();
    return { ok: true, data: await fn(usuario) };
  } catch (err) {
    return { ok: false, error: aErrorPublico(err).error };
  }
}

/** Variante sin sesión (solo el login). */
export async function ejecutarAccionPublica<T>(fn: () => Promise<T>): Promise<ResultadoAccion<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return { ok: false, error: aErrorPublico(err).error };
  }
}
