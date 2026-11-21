import { z } from "zod";
import { booleanoQuery, dia, enteroPositivo, id, importe, MSJ, paginacion, textoObligatorio, textoOpcional } from "./comunes";

// Esquemas de categorías, productos y stock. Compartidos entre formularios y servicios.

// ───────── Categorías (RF-P7) ─────────
export const crearCategoriaSchema = z.strictObject({
  nombre: textoObligatorio(60),
});
export const editarCategoriaSchema = z.strictObject({
  nombre: textoObligatorio(60).optional(),
  activa: z.boolean().optional(),
});

// ───────── Productos (RF-P1, RF-P2, RF-P3) ─────────
const codigo = () =>
  textoObligatorio(30)
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9-]*$/, "Solo letras, números y guiones (ej. HE-001)."));

const stockMinimo = () => z.number({ error: MSJ.obligatorio }).int(MSJ.entero).min(0, MSJ.noNegativo);

// RF-P2: la existencia NO se carga a mano. El stock inicial se registra como
// un movimiento de ingreso con motivo "Stock inicial".
export const crearProductoSchema = z.strictObject({
  codigo: codigo(),
  descripcion: textoObligatorio(120),
  categoriaId: z.number({ error: "Elegí una categoría." }).int().positive("Elegí una categoría."),
  precio: importe(),
  stockMinimo: stockMinimo(),
  stockInicial: z.number().int(MSJ.entero).min(0, MSJ.noNegativo).optional(),
});
export type CrearProductoInput = z.input<typeof crearProductoSchema>;

// Estricto: si llega `existencia` (o cualquier campo no previsto) responde 422.
export const editarProductoSchema = z.strictObject({
  codigo: codigo().optional(),
  descripcion: textoObligatorio(120).optional(),
  categoriaId: z.number().int().positive("Elegí una categoría.").optional(),
  precio: importe().optional(),
  stockMinimo: stockMinimo().optional(),
  activo: z.boolean().optional(),
});
export type EditarProductoInput = z.input<typeof editarProductoSchema>;

export const listarProductosSchema = z.object({
  q: z.string().trim().optional(),
  categoriaId: id().optional().catch(undefined),
  bajoMinimo: booleanoQuery(),
  // Por defecto solo activos; el admin puede pedir "false" o "todos".
  activo: z.enum(["true", "false", "todos"]).default("true").catch("true"),
  ...paginacion,
});

// ───────── Movimientos manuales de stock (RF-P4, RF-P5) ─────────
export const MOTIVOS_INGRESO = ["Reposición", "Stock inicial", "Devolución de cliente"] as const;
export const MOTIVOS_EGRESO = ["Rotura", "Vencimiento", "Ajuste de inventario", "Uso interno"] as const;

export const movimientoManualSchema = z
  .strictObject({
    tipo: z.enum(["ingreso", "egreso"], { error: "Elegí ingreso o egreso." }),
    cantidad: enteroPositivo(),
    motivo: z.string({ error: "Elegí un motivo." }).min(1, "Elegí un motivo."),
    observacion: textoOpcional(200),
  })
  .refine(
    (d) =>
      d.tipo === "ingreso"
        ? (MOTIVOS_INGRESO as readonly string[]).includes(d.motivo)
        : (MOTIVOS_EGRESO as readonly string[]).includes(d.motivo),
    { path: ["motivo"], message: "Motivo no válido para este tipo de movimiento." },
  );
export type MovimientoManualInput = z.input<typeof movimientoManualSchema>;

export const listarMovimientosSchema = z.object({
  productoId: id().optional().catch(undefined),
  tipo: z.enum(["venta", "anulacion", "ingreso", "egreso"]).optional().catch(undefined),
  desde: dia().optional().catch(undefined),
  hasta: dia().optional().catch(undefined),
  ...paginacion,
});
