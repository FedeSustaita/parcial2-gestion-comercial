import { ruta } from "@/lib/api";
import { anularFactura } from "@/services/facturas";

// POST /api/facturas/{id}/anulacion — RF-V9 (admin).
export const POST = ruta(async ({ usuario, params, body }) => anularFactura(usuario, params.id, body));
