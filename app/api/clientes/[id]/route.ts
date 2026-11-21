import { ruta } from "@/lib/api";
import { actualizarCliente, obtenerCliente } from "@/services/clientes";

// GET /api/clientes/{id} — RF-C3. PATCH — RF-C2, RF-C7 (baja lógica con "activo": false).
export const GET = ruta(async ({ usuario, params }) => obtenerCliente(usuario, params.id));
export const PATCH = ruta(async ({ usuario, params, body }) => actualizarCliente(usuario, params.id, body));
