import "dotenv/config";
import { db } from "./index";
import type { UsuarioSesion } from "../services/auth";
import { crearCategoria } from "../services/categorias";
import { crearCliente } from "../services/clientes";
import { saldoCliente } from "../services/cuenta";
import { anularFactura, crearFactura } from "../services/facturas";
import { registrarPago } from "../services/pagos";
import { ApiError } from "../lib/api-error";
import { USUARIOS_DEMO } from "../lib/demo";
import { crearProducto } from "../services/productos";
import { crearPrimerAdmin, crearUsuario } from "../services/usuarios";

// Script de datos iniciales (sección 10.7). Crea todo con los MISMOS
// servicios que usa la aplicación, así los datos de prueba cumplen las
// reglas de negocio y el script sirve además como prueba de los servicios.
//
// Usuarios de prueba (ver README):
//   admin@comercio.test    / admin1234     (Administrador)
//   vendedor@comercio.test / vendedor1234  (Vendedor)

async function main() {
  const existentes = await db.query.usuarios.findFirst();
  if (existentes) {
    console.log("La base ya tiene datos: el seed no se vuelve a ejecutar.");
    console.log("Para empezar de cero, borrá local.db y corré db:migrate y db:seed.");
    return;
  }

  // RF-U3: el primer administrador lo crea este script.
  const admin = await crearPrimerAdmin(USUARIOS_DEMO.admin);
  const actor: UsuarioSesion = { id: admin.id, nombre: admin.nombre, email: admin.email, rol: "admin" };

  await crearUsuario(actor, { ...USUARIOS_DEMO.vendedor, rol: "vendedor" });
  console.log("✓ 2 usuarios");

  // 5 categorías y 30 productos. El stock inicial entra como movimiento de
  // ingreso "Stock inicial" (crearProducto llama a moverStock).
  const ids: Record<string, number> = {};
  for (const nombre of Object.keys(CATALOGO)) {
    ids[nombre] = (await crearCategoria(actor, { nombre })).id;
  }
  let n = 0;
  for (const [categoria, items] of Object.entries(CATALOGO)) {
    for (const [codigo, descripcion, precioPesos, stockMinimo, stockInicial] of items) {
      await crearProducto(actor, {
        codigo,
        descripcion,
        categoriaId: ids[categoria],
        precio: precioPesos * 100,
        stockMinimo,
        stockInicial,
      });
      n++;
    }
  }
  console.log(`✓ ${Object.keys(CATALOGO).length} categorías, ${n} productos`);

  // 10 clientes: 6 con cuenta corriente (algunos con límite de crédito).
  const clientes = [];
  for (const c of CLIENTES) clientes.push(await crearCliente(actor, c));
  console.log(`✓ ${clientes.length} clientes`);

  // 50 facturas en los últimos 30 días, creadas con crearFactura() (el mismo
  // servicio que usa la pantalla de Nueva venta), en orden cronológico para
  // que la numeración siga a las fechas. Si una combinación no pasa una regla
  // (sin stock, límite de crédito), se prueba otra: el servicio decide.
  const usuarios = [actor, { id: 2, nombre: USUARIOS_DEMO.vendedor.nombre, email: USUARIOS_DEMO.vendedor.email, rol: "vendedor" as const }];
  const conCC = clientes.filter((c) => c.cuentaCorriente);
  const productosIds = Array.from({ length: n }, (_, i) => i + 1);
  const azar = generador(20261122);
  const ahora = Date.now();
  const fechas = Array.from({ length: 50 }, (_, i) => {
    const diasAtras = Math.floor((49 - i) * 30 / 50); // de hace 29 días a hoy
    const hora = 9 + Math.floor(azar() * 11);
    const d = new Date(ahora - diasAtras * 86400000);
    d.setUTCHours(hora + 3, Math.floor(azar() * 60), 0, 0); // hora de Argentina (UTC−3)
    return new Date(Math.min(d.getTime(), ahora - (50 - i) * 60000));
  }).sort((a, b) => a.getTime() - b.getTime());

  const emitidas: { id: number; forma: string }[] = [];
  for (const fecha of fechas) {
    for (let intento = 0; intento < 20; intento++) {
      const r = azar();
      const forma = r < 0.5 ? "contado" : r < 0.8 ? "tarjeta" : "cuenta_corriente";
      const cliente = forma === "cuenta_corriente" ? elegir(azar, conCC) : azar() < 0.35 ? elegir(azar, clientes) : null;
      const cantidadItems = 1 + Math.floor(azar() * 3);
      const ids = new Set<number>();
      while (ids.size < cantidadItems) ids.add(elegir(azar, productosIds));
      const items = [...ids].map((productoId) => ({ productoId, cantidad: 1 + Math.floor(azar() * 3) }));
      const pago =
        forma === "contado"
          ? { forma, montoRecibido: undefined }
          : forma === "tarjeta"
            ? { forma, tarjeta: { tipo: azar() < 0.5 ? "debito" : "credito", marca: elegir(azar, ["Visa", "Mastercard", "Cabal"]), ultimos4: String(1000 + Math.floor(azar() * 9000)) } }
            : { forma };
      try {
        const f = await crearFactura(elegir(azar, usuarios), { clienteId: cliente?.id ?? null, items, pago }, { fecha });
        emitidas.push({ id: f.id, forma });
        break;
      } catch (e) {
        if (!(e instanceof ApiError)) throw e; // un error inesperado sí corta el seed
      }
    }
  }
  console.log(`✓ ${emitidas.length} facturas`);

  // Pagos con recibo: cada cliente con deuda paga una parte unos días después.
  let pagos = 0;
  for (const c of conCC) {
    const saldo = await saldoCliente(db, c.id);
    if (saldo <= 0 || azar() < 0.25) continue;
    const importe = Math.max(100, Math.round((saldo * (0.3 + azar() * 0.5)) / 100) * 100);
    const fecha = new Date(ahora - Math.floor(azar() * 4 + 1) * 86400000 / 3);
    await registrarPago(actor, c.id, { importe, medio: elegir(azar, ["efectivo", "transferencia", "tarjeta_debito"]), observacion: "Pago a cuenta" }, { fecha });
    pagos++;
  }
  console.log(`✓ ${pagos} pagos`);

  // Una anulación (con el servicio: reingresa stock y, si corresponde, acredita).
  const aAnular = emitidas[emitidas.length - 8];
  if (aAnular) {
    await anularFactura(actor, aAnular.id, { motivo: "Error en la carga de cantidades" });
    console.log("✓ 1 factura anulada");
  }
  console.log("Seed completo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Números pseudoaleatorios con semilla fija: el seed da siempre los mismos datos.
function generador(semilla: number) {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function elegir<T>(azar: () => number, lista: T[]): T {
  return lista[Math.floor(azar() * lista.length)];
}

// [código, descripción, precio en pesos, stock mínimo, stock inicial]
type ItemSeed = [string, string, number, number, number];
// Corralón de construcción y hogar: todo se vende por unidad (bolsas, rollos,
// latas, piezas), así la existencia sigue siendo un número entero.
const CATALOGO: Record<string, ItemSeed[]> = {
  "Materiales": [
    ["MA-001", "Cemento portland bolsa 50 kg", 11800, 10, 60],
    ["MA-002", "Cal hidráulica bolsa 25 kg", 6400, 10, 45],
    ["MA-003", "Adhesivo para cerámicos bolsa 30 kg", 9900, 8, 30],
    ["MA-004", "Ladrillo hueco 12x18x33", 950, 200, 1200],
    ["MA-005", "Hierro aletado 8 mm x 12 m", 14500, 20, 90],
    ["MA-006", "Malla sima 15x15 cm 2x6 m", 52000, 4, 3],
  ],
  Herramientas: [
    ["HE-001", "Pala ancha con mango", 24500, 4, 18],
    ["HE-002", "Cuchara de albañil N° 8", 7800, 6, 25],
    ["HE-003", "Nivel de aluminio 60 cm", 15600, 4, 12],
    ["HE-004", "Carretilla 70 L rueda neumática", 98000, 2, 6],
    ["HE-005", "Amoladora angular 115 mm 850 W", 89000, 2, 5],
    ["HE-006", "Disco de corte para metal 115 mm", 2100, 20, 14],
  ],
  Electricidad: [
    ["EL-001", "Cable unipolar 2,5 mm rollo 100 m", 68000, 3, 10],
    ["EL-002", "Foco LED 9 W E27 luz fría", 2600, 20, 90],
    ["EL-003", "Llave térmica bipolar 2x20 A", 18500, 4, 12],
    ["EL-004", "Disyuntor diferencial 2x40 A", 52000, 2, 4],
    ["EL-005", "Toma doble con tierra", 4800, 10, 40],
    ["EL-006", "Caja de luz rectangular 5x10", 750, 30, 25],
  ],
  Sanitarios: [
    ["SA-001", "Caño termofusión 20 mm x 4 m", 5200, 15, 70],
    ["SA-002", "Codo termofusión 20 mm", 450, 50, 300],
    ["SA-003", "Llave de paso esférica 3/4\"", 11200, 4, 15],
    ["SA-004", "Grifería monocomando para cocina", 78000, 2, 6],
    ["SA-005", "Inodoro con mochila", 185000, 1, 3],
    ["SA-006", "Sellador siliconado sanitario 280 ml", 6100, 8, 6],
  ],
  "Pinturas y terminaciones": [
    ["PT-001", "Látex interior blanco 20 L", 112000, 3, 12],
    ["PT-002", "Impermeabilizante para techos 20 kg", 98000, 2, 5],
    ["PT-003", "Rodillo de lana 22 cm", 9800, 6, 20],
    ["PT-004", "Pincel N° 25", 4300, 10, 35],
    ["PT-005", "Enduido plástico interior 4 L", 15400, 4, 3],
    ["PT-006", "Cinta de papel 48 mm x 50 m", 3900, 12, 50],
  ],
};

const CLIENTES = [
  { tipoDoc: "DNI", nroDoc: "27654321", nombre: "Gustavo Paredes", domicilio: "Santiago del Estero 1220", telefono: "381 452-3301", email: "gustavo.paredes@correo.test", cuentaCorriente: true, limiteCredito: 80000000 },
  { tipoDoc: "CUIT", nroDoc: "30715558884", nombre: "Obras Tucumán S.R.L.", domicilio: "Av. Sarmiento 780", telefono: "381 431-9090", email: "compras@obrastucuman.test", cuentaCorriente: true, limiteCredito: 500000000 },
  { tipoDoc: "DNI", nroDoc: "33987654", nombre: "Natalia Quiroga", domicilio: "Crisóstomo Álvarez 560", telefono: "381 509-4412", cuentaCorriente: true, limiteCredito: 40000000 },
  { tipoDoc: "DNI", nroDoc: "25123456", nombre: "Raúl Medina (albañil)", domicilio: "Av. Roca 2100", telefono: "381 466-1834", cuentaCorriente: true },
  { tipoDoc: "CUIT", nroDoc: "20294567891", nombre: "Electro Instalaciones Ibarra", domicilio: "Lamadrid 930", telefono: "381 597-2210", email: "ibarra.instalaciones@correo.test", cuentaCorriente: true, limiteCredito: 150000000 },
  { tipoDoc: "DNI", nroDoc: "40111222", nombre: "Florencia Díaz", domicilio: "Monteagudo 415", telefono: "381 612-7788", cuentaCorriente: true, limiteCredito: 25000000 },
  { tipoDoc: "DNI", nroDoc: "31222333", nombre: "Sebastián Acosta", telefono: "381 455-6021", cuentaCorriente: false },
  { tipoDoc: "DNI", nroDoc: "37444555", nombre: "Camila Rojas", email: "camila.rojas@correo.test", cuentaCorriente: false },
  { tipoDoc: "DNI", nroDoc: "29555666", nombre: "Héctor Villalba", domicilio: "Junín 1480", cuentaCorriente: false },
  { tipoDoc: "CUIT", nroDoc: "27368889990", nombre: "Estudio de Arquitectura Molina", domicilio: "25 de Mayo 620", telefono: "381 421-8844", cuentaCorriente: false },
];
