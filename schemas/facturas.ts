import { z } from "zod";
import { ESTADOS_FACTURA, FORMAS_PAGO, TIPOS_TARJETA } from "@/db/schema";
import { dia, enteroPositivo, id, importe, MSJ, paginacion, textoObligatorio } from "./comunes";

// Esquemas de facturación (RF-V1 a RF-V9). Compartidos entre la pantalla de
// Nueva venta y el servicio que confirma la factura.

/** Máximo de unidades por renglón (cambio de ejemplo de la defensa: "más de 50"). */
export const MAX_UNIDADES_POR_RENGLON = 9999;

const item = z.strictObject({
  productoId: z.number({ error: "Producto inválido." }).int().positive(),
  cantidad: enteroPositivo().max(MAX_UNIDADES_POR_RENGLON, `Máximo ${MAX_UNIDADES_POR_RENGLON} unidades por renglón.`),
});

// RF-V5 / regla 9: de la tarjeta solo tipo, marca y últimos 4 dígitos. Los
// objetos son estrictos: si llega el número completo (o cualquier otro campo)
// se rechaza con 422.
const pago = z.discriminatedUnion(
  "forma",
  [
    z.strictObject({
      forma: z.literal("contado"),
      montoRecibido: importe().optional(), // si falta, se toma el total
    }),
    z.strictObject({
      forma: z.literal("tarjeta"),
      tarjeta: z.strictObject({
        tipo: z.enum(TIPOS_TARJETA, { error: "Elegí débito o crédito." }),
        marca: textoObligatorio(30),
        ultimos4: z.string({ error: MSJ.obligatorio }).regex(/^\d{4}$/, "Ingresá exactamente 4 dígitos."),
      }),
    }),
    z.strictObject({ forma: z.literal("cuenta_corriente") }),
  ],
  { error: "Elegí la forma de pago." },
);

// POST /api/facturas: comprador, productos con cantidades y forma de pago.
// NO lleva precios ni totales: los calcula el servidor.
export const crearFacturaSchema = z
  .strictObject({
    clienteId: z.number().int().positive().nullable(), // null = consumidor final
    items: z.array(item, { error: "Agregá al menos un producto." }).min(1, "Agregá al menos un producto."),
    pago,
  })
  .refine((d) => new Set(d.items.map((i) => i.productoId)).size === d.items.length, {
    path: ["items"],
    message: "Hay productos repetidos: sumá la cantidad en un solo renglón.",
  });
export type CrearFacturaInput = z.input<typeof crearFacturaSchema>;

export const listarFacturasSchema = z.object({
  q: z.string().trim().optional(), // número o nombre del cliente
  desde: dia().optional().catch(undefined),
  hasta: dia().optional().catch(undefined),
  clienteId: id().optional().catch(undefined),
  vendedorId: id().optional().catch(undefined),
  forma: z.enum(FORMAS_PAGO).optional().catch(undefined),
  estado: z.enum(ESTADOS_FACTURA).optional().catch(undefined),
  ...paginacion,
});

// RF-V9: anulación con motivo obligatorio.
export const anularFacturaSchema = z.strictObject({
  motivo: textoObligatorio(200),
});
