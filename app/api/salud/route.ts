import { NextResponse } from "next/server";

// GET /api/salud — diagnóstico del despliegue (no es parte de las 31 rutas
// de la consigna). Informa SOLO si las variables existen y si la base
// responde; nunca muestra sus valores. Es pública para poder revisar el
// deploy sin iniciar sesión.
export async function GET() {
  const url = process.env.DATABASE_URL;
  const estado = {
    databaseUrl: !url ? "falta" : url.startsWith("file:") ? "archivo local" : "turso",
    databaseAuthToken: process.env.DATABASE_AUTH_TOKEN ? "presente" : "falta",
    sessionSecret: (process.env.SESSION_SECRET?.length ?? 0) >= 32 ? "presente" : "falta o es corto",
    base: "sin probar",
    error: undefined as string | undefined,
  };
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    const [r] = await db.all<{ n: number }>(sql`select count(*) as n from usuarios`);
    estado.base = `ok (${r.n} usuarios)`;
  } catch (e) {
    estado.base = "error";
    estado.error = (e as Error)?.message?.slice(0, 200);
    console.error("[salud]", e);
  }
  return NextResponse.json(estado, { status: estado.base.startsWith("ok") ? 200 : 503 });
}
