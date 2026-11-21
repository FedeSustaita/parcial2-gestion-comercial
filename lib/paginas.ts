import "server-only";
import { notFound } from "next/navigation";
import { ApiError } from "./api-error";

// Ayudas para Server Components (páginas).

/** searchParams de Next → objeto plano de strings (toma el primer valor). */
export function aQuery(sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const valor = Array.isArray(v) ? v[0] : v;
    if (valor !== undefined && valor !== "") q[k] = valor;
  }
  return q;
}

/** Si el servicio responde 404, muestra la página "no encontrado" de Next. */
export async function o404<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.code === "NO_ENCONTRADO") notFound();
    throw e;
  }
}
