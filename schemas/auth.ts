import { z } from "zod";
import { email, MSJ } from "./comunes";

export const passwordNueva = () =>
  z.string({ error: MSJ.obligatorio }).min(8, "Mínimo 8 caracteres.").max(100, "Máximo 100 caracteres.");

// RF-U1
export const loginSchema = z.object({
  email: email(),
  password: z.string({ error: MSJ.obligatorio }).min(1, MSJ.obligatorio),
});
export type LoginInput = z.input<typeof loginSchema>;

// RF-U5: cambio de la propia contraseña.
export const cambiarPasswordSchema = z
  .strictObject({
    actual: z.string({ error: MSJ.obligatorio }).min(1, MSJ.obligatorio),
    nueva: passwordNueva(),
    confirmacion: z.string().optional(),
  })
  .refine((d) => d.confirmacion === undefined || d.confirmacion === d.nueva, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  });
export type CambiarPasswordInput = z.input<typeof cambiarPasswordSchema>;
