import { ruta } from "@/lib/api";
import { proximoNumero } from "@/services/facturas";

// GET /api/facturas/proximo-numero — RF-V1 (informativo).
export const GET = ruta(async ({ usuario }) => proximoNumero(usuario));
