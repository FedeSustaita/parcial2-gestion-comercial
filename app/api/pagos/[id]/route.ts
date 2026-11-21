import { ruta } from "@/lib/api";
import { obtenerPago } from "@/services/pagos";

// GET /api/pagos/{id} — RF-C5 (reimprimir el recibo).
export const GET = ruta(async ({ usuario, params }) => obtenerPago(usuario, params.id));
