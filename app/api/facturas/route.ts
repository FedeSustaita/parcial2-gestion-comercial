import { ruta } from "@/lib/api";
import { crearFactura, listarFacturas } from "@/services/facturas";

// GET /api/facturas — RF-V8. POST — RF-V1 a RF-V6 (emitir factura en una transacción).
export const GET = ruta(async ({ usuario, query }) => listarFacturas(usuario, query));
export const POST = ruta(async ({ usuario, body }) => crearFactura(usuario, body), { status: 201 });
