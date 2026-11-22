import { ruta } from "@/lib/api";
import { obtenerTablero } from "@/services/tablero";

// GET /api/tablero — RF-T1 a RF-T3. Todo lo que muestra la pantalla de inicio en una sola respuesta.
export const GET = ruta(async ({ usuario }) => obtenerTablero(usuario));
