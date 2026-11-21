import type { z } from "zod";
import { errores, type DetalleCampo } from "./api-error";

// Convierte los issues de Zod al formato de `details` de la API:
// [{ campo: "codigo", mensaje: "Es obligatorio." }]
export function detallesZod(error: z.ZodError): DetalleCampo[] {
  return error.issues.map((issue) => ({
    campo: issue.path.length ? issue.path.join(".") : (issue.code === "unrecognized_keys" ? issue.keys.join(",") : "_"),
    mensaje: issue.message,
  }));
}

// Primer paso de todo servicio (sección 10.2): validar con el esquema.
// Si falla, lanza ApiError 422 VALIDACION con el detalle por campo.
export function validar<T extends z.ZodType>(schema: T, datos: unknown): z.output<T> {
  const r = schema.safeParse(datos);
  if (!r.success) throw errores.validacion(detallesZod(r.error));
  return r.data;
}
