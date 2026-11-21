import { ruta } from "@/lib/api";
import { registrarPago } from "@/services/pagos";

// POST /api/clientes/{id}/pagos — RF-C5.
export const POST = ruta(async ({ usuario, params, body }) => registrarPago(usuario, params.id, body), { status: 201 });
