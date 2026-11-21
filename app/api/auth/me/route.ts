import { ruta } from "@/lib/api";

// GET /api/auth/me — RF-U2. El envoltorio ya resolvió el usuario (o 401).
export const GET = ruta(async ({ usuario }) => usuario);
