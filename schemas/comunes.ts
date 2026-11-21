import { z } from "zod";

// Piezas compartidas por todos los esquemas. Estos módulos los usan TANTO el
// servidor (servicios) como los formularios (cliente): mismas reglas y
// mismos mensajes en los dos lados (sección 10.4).

export const MSJ = {
  obligatorio: "Es obligatorio.",
  email: "Ingresá un email válido.",
  entero: "Debe ser un número entero.",
  positivo: "Debe ser mayor que cero.",
  noNegativo: "No puede ser negativo.",
};

export const textoObligatorio = (max = 200) =>
  z.string({ error: MSJ.obligatorio }).trim().min(1, MSJ.obligatorio).max(max, `Máximo ${max} caracteres.`);

export const textoOpcional = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .nullish()
    .transform((v) => (v ? v : null));

export const email = () =>
  z.string({ error: MSJ.obligatorio }).trim().toLowerCase().min(1, MSJ.obligatorio).pipe(z.email(MSJ.email));

/** Importe en centavos: entero, nunca coma flotante (regla 10). */
export const importe = () =>
  z.number({ error: MSJ.obligatorio }).int("El importe va en centavos enteros.").min(0, MSJ.noNegativo);

export const importePositivo = () => importe().refine((v) => v > 0, MSJ.positivo);

export const enteroPositivo = () =>
  z.number({ error: MSJ.obligatorio }).int(MSJ.entero).positive(MSJ.positivo);

export const id = () => z.coerce.number({ error: "Id inválido." }).int().positive("Id inválido.");

/** "AAAA-MM-DD" */
export const dia = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD).");

/** Paginación estándar (sección 11.1): page desde 1, pageSize 20 por defecto, máximo 100. */
export const paginacion = {
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
};

export const booleanoQuery = () =>
  z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true"));

export type Paginado<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};
