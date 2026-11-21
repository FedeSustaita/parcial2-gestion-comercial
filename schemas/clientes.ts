import { z } from "zod";
import { MEDIOS_PAGO, TIPOS_DOC } from "@/db/schema";
import { booleanoQuery, dia, importe, importePositivo, MSJ, paginacion, textoObligatorio, textoOpcional } from "./comunes";

// Esquemas de clientes, cuenta corriente y pagos. Compartidos entre
// formularios y servicios.

const soloDigitos = (v: string) => v.replace(/\D/g, "");

const camposCliente = {
  tipoDoc: z.enum(TIPOS_DOC, { error: "Elegí DNI o CUIT." }),
  // Se aceptan puntos y guiones; se guarda solo con dígitos.
  nroDoc: z.string({ error: MSJ.obligatorio }).trim().min(1, MSJ.obligatorio).transform(soloDigitos),
  nombre: textoObligatorio(120),
  domicilio: textoOpcional(160),
  telefono: textoOpcional(40),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .nullish()
    .transform((v) => (v ? v : null))
    .pipe(z.email("Ingresá un email válido.").nullable()),
  cuentaCorriente: z.boolean().default(false),
  limiteCredito: importe().nullish().transform((v) => v ?? null), // null = sin límite
};

// Reglas que cruzan campos: largo del documento según el tipo.
function validarDocumento(d: { tipoDoc?: string; nroDoc?: string }, ctx: z.RefinementCtx) {
  if (!d.tipoDoc || d.nroDoc === undefined) return;
  if (d.tipoDoc === "DNI" && !/^\d{7,8}$/.test(d.nroDoc)) {
    ctx.addIssue({ code: "custom", path: ["nroDoc"], message: "El DNI tiene 7 u 8 dígitos." });
  }
  if (d.tipoDoc === "CUIT" && !/^\d{11}$/.test(d.nroDoc)) {
    ctx.addIssue({ code: "custom", path: ["nroDoc"], message: "El CUIT tiene 11 dígitos." });
  }
}

// RF-C2 / RF-V2: alta de cliente (misma ruta que el alta rápida desde Nueva venta).
export const crearClienteSchema = z.strictObject(camposCliente).superRefine(validarDocumento);
export type CrearClienteInput = z.input<typeof crearClienteSchema>;

// RF-C2 / RF-C7: edición y baja lógica. Estricto: el saldo nunca se acepta.
export const editarClienteSchema = z
  .strictObject({
    tipoDoc: camposCliente.tipoDoc.optional(),
    nroDoc: camposCliente.nroDoc.optional(),
    nombre: camposCliente.nombre.optional(),
    domicilio: camposCliente.domicilio.optional(),
    telefono: camposCliente.telefono.optional(),
    email: camposCliente.email.optional(),
    cuentaCorriente: z.boolean().optional(),
    limiteCredito: importe().nullable().optional(),
    activo: z.boolean().optional(),
  })
  .superRefine(validarDocumento);
export type EditarClienteInput = z.input<typeof editarClienteSchema>;

export const listarClientesSchema = z.object({
  q: z.string().trim().optional(),
  conDeuda: booleanoQuery(),
  orden: z.enum(["saldo", "nombre"]).optional().catch(undefined),
  activo: z.enum(["true", "false", "todos"]).default("true").catch("true"),
  ...paginacion,
});

export const cuentaClienteSchema = z.object({
  desde: dia().optional().catch(undefined),
  hasta: dia().optional().catch(undefined),
});

// RF-C5: registrar pago a cuenta.
export const registrarPagoSchema = z.strictObject({
  importe: importePositivo(),
  medio: z.enum(MEDIOS_PAGO, { error: "Elegí el medio de pago." }),
  observacion: textoOpcional(200),
});
export type RegistrarPagoInput = z.input<typeof registrarPagoSchema>;
