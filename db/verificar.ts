import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";

// Verificación de consistencia (sección 10.8, punto 5):
// la existencia de cada producto coincide con la suma de sus movimientos, y
// el saldo de cada cliente (débitos − créditos) nunca queda negativo (regla 8).
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

  // El saldo se deriva SIEMPRE de los movimientos (no hay campo guardado que
  // pueda desincronizarse). Verificamos que ningún cliente tenga saldo a favor.
  const negativos = await db.all<{ nombre: string; saldo: number }>(sql`
    select c.nombre, sum(case when m.tipo = 'debito' then m.importe else -m.importe end) as saldo
    from clientes c join movimientos_cuenta m on m.cliente_id = c.id
    group by c.id having saldo < 0
  `);
  if (negativos.length === 0) console.log("✓ Saldos: ningún cliente tiene saldo a favor (débitos − créditos ≥ 0).");
  else {
    console.log("✗ Clientes con saldo negativo:");
    console.table(negativos);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
