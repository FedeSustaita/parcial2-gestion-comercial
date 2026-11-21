import { ruta } from "@/lib/api";
import { cuentaCliente } from "@/services/clientes";

// GET /api/clientes/{id}/cuenta — RF-C4. Acepta desde y hasta.
export const GET = ruta(async ({ usuario, params, query }) => cuentaCliente(usuario, params.id, query));
