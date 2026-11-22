import { ruta } from "@/lib/api";
import { obtenerFactura } from "@/services/facturas";

// GET /api/facturas/{id} — RF-V7.
export const GET = ruta(async ({ usuario, params }) => obtenerFactura(usuario, params.id));
