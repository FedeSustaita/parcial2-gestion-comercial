import { z } from "zod";
import { ROLES } from "@/db/schema";
import { passwordNueva } from "./auth";
import { booleanoQuery, email, paginacion, textoObligatorio } from "./comunes";

const rol = z.enum(ROLES, { error: "Elegí un rol." });

// RF-U4: alta de usuario por el administrador.
export const crearUsuarioSchema = z.strictObject({
  nombre: textoObligatorio(100),
  email: email(),
  rol,
  password: passwordNueva(),
});
export type CrearUsuarioInput = z.input<typeof crearUsuarioSchema>;

// RF-U4: edición. Estricto: rechaza campos no previstos (p. ej. passwordHash).
export const editarUsuarioSchema = z.strictObject({
  nombre: textoObligatorio(100).optional(),
  email: email().optional(),
  rol: rol.optional(),
  activo: z.boolean().optional(),
});
export type EditarUsuarioInput = z.input<typeof editarUsuarioSchema>;

export const listarUsuariosSchema = z.object({
  q: z.string().trim().optional(),
  activo: booleanoQuery(),
  ...paginacion,
});
