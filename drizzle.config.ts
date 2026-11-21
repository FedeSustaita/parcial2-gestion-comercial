import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Configuración de drizzle-kit: de acá salen las migraciones (db/migrations)
// y contra esta base se aplican. El dialecto "turso" sirve tanto para un
// archivo SQLite local (file:local.db) como para la base remota de Turso.
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
