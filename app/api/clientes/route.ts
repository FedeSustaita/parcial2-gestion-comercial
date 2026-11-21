import { ruta } from "@/lib/api";
import { crearCliente, listarClientes } from "@/services/clientes";

// GET /api/clientes — RF-C1, RF-C6. POST — RF-C2, RF-V2 (también la usa el alta rápida de Nueva venta).
export const GET = ruta(async ({ usuario, query }) => listarClientes(usuario, query));
export const POST = ruta(async ({ usuario, body }) => crearCliente(usuario, body), { status: 201 });
