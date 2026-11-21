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
