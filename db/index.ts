import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Conexión única a la base. La misma variable DATABASE_URL decide si es
// el archivo SQLite local (file:local.db) o la base de Turso (libsql://...).
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema, casing: "snake_case" });

export type DB = typeof db;
// Transacción o base: los servicios aceptan cualquiera de las dos para
// poder componerse dentro de una misma transacción (p. ej. moverStock).
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type DBoTx = DB | Tx;

/**
 * Transacción de escritura con reintentos. SQLite/libSQL admite UNA
 * transacción de escritura a la vez: si otra está en curso (por ejemplo, dos
 * vendedores confirmando al mismo tiempo), la base responde SQLITE_BUSY.
 * En ese caso esperamos un poco y reintentamos la transacción COMPLETA, que
 * vuelve a leer el stock actualizado. Así las operaciones quedan serializadas
 * y nunca se pisan.
 */
export async function transaccion<T>(fn: (tx: Tx) => Promise<T>, intentos = 25): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await db.transaction(fn);
    } catch (e) {
      const ocupado = (e as { code?: string })?.code === "SQLITE_BUSY" || /SQLITE_BUSY|database is locked/i.test(String((e as Error)?.message));
      if (!ocupado || i >= intentos) throw e;
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 80 * Math.min(i, 5)));
    }
  }
}
