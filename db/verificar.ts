import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";

// Verificación de consistencia (sección 10.8, punto 5):
// la existencia de cada producto coincide con la suma de sus movimientos.
// Uso: pnpm run db:verificar  (sirve también contra Turso cambiando DATABASE_URL)

async function main() {
  const stock = await db.all<{ codigo: string; existencia: number; suma: number }>(sql`
    select p.codigo, p.existencia, coalesce(sum(m.cantidad), 0) as suma
    from productos p left join movimientos_stock m on m.producto_id = p.id
    group by p.id
    having p.existencia <> coalesce(sum(m.cantidad), 0)
  `);
  const [{ productos }] = await db.all<{ productos: number }>(sql`select count(*) as productos from productos`);

  if (stock.length === 0) console.log(`✓ Stock: los ${productos} productos cuadran con sus movimientos.`);
  else {
    console.log("✗ Productos descuadrados:");
    console.table(stock);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
