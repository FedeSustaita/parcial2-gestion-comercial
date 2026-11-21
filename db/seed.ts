import "dotenv/config";
import { db } from "./index";
import type { UsuarioSesion } from "../services/auth";
import { crearCategoria } from "../services/categorias";
import { crearCliente } from "../services/clientes";
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
  const admin = await crearPrimerAdmin({
    nombre: "Laura Méndez",
    email: "admin@comercio.test",
    password: "admin1234",
  });
  const actor: UsuarioSesion = { id: admin.id, nombre: admin.nombre, email: admin.email, rol: "admin" };

  await crearUsuario(actor, {
    nombre: "Pablo Ruiz",
    email: "vendedor@comercio.test",
    rol: "vendedor",
    password: "vendedor1234",
  });
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
  for (const c of CLIENTES) await crearCliente(actor, c);
  console.log(`✓ ${CLIENTES.length} clientes`);

  // Etapa 5: 50 facturas en los últimos 30 días y pagos.
  console.log("Seed completo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// [código, descripción, precio en pesos, stock mínimo, stock inicial]
type ItemSeed = [string, string, number, number, number];
const CATALOGO: Record<string, ItemSeed[]> = {
  Herramientas: [
    ["HE-001", "Martillo carpintero 500 g", 12500, 5, 24],
    ["HE-002", "Destornillador Phillips N° 2", 4200, 8, 40],
    ["HE-003", "Pinza universal 8\"", 9800, 5, 18],
    ["HE-004", "Llave francesa 10\"", 15600, 4, 12],
    ["HE-005", "Cinta métrica 5 m", 6900, 6, 30],
    ["HE-006", "Serrucho 20\"", 18900, 3, 8],
  ],
  Electricidad: [
    ["EL-001", "Cinta aisladora 20 m", 1900, 15, 80],
    ["EL-002", "Lámpara LED 12 W", 3200, 20, 90],
    ["EL-003", "Toma corriente doble", 4800, 10, 35],
    ["EL-004", "Interruptor de luz simple", 3500, 10, 40],
    ["EL-005", "Cable unipolar 2,5 mm (metro)", 1150, 50, 300],
    ["EL-006", "Zapatilla 5 tomas con fusible", 14500, 5, 3],
  ],
  "Plomería": [
    ["PL-001", "Cinta de teflón 1/2\"", 900, 20, 120],
    ["PL-002", "Canilla de bronce 1/2\"", 16800, 4, 10],
    ["PL-003", "Codo PVC 90° 40 mm", 1250, 20, 60],
    ["PL-004", "Sellador de silicona 280 ml", 5600, 8, 25],
    ["PL-005", "Flexible de agua 40 cm", 3900, 10, 6],
    ["PL-006", "Llave de paso 3/4\"", 11200, 4, 9],
  ],
  Pinturas: [
    ["PI-001", "Látex interior blanco 4 L", 32500, 4, 14],
    ["PI-002", "Esmalte sintético negro 1 L", 15800, 4, 12],
    ["PI-003", "Pincel N° 20", 3600, 10, 40],
    ["PI-004", "Rodillo antigota 22 cm", 7400, 6, 20],
    ["PI-005", "Lija al agua grano 120", 650, 30, 150],
    ["PI-006", "Diluyente aguarrás 1 L", 6200, 5, 4],
  ],
  "Tornillería": [
    ["TO-001", "Tornillo autoperforante 8x1\" (x100)", 4500, 10, 50],
    ["TO-002", "Tarugo Fischer N° 8 (x50)", 2900, 10, 60],
    ["TO-003", "Clavo punta París 2\" (1 kg)", 5200, 8, 30],
    ["TO-004", "Bulón con tuerca 1/4 x 2\" (x10)", 3100, 8, 25],
    ["TO-005", "Arandela plana 1/4\" (x50)", 1600, 10, 45],
    ["TO-006", "Tornillo para madera 6x1 1/2\" (x100)", 3800, 10, 7],
  ],
};

const CLIENTES = [
  { tipoDoc: "DNI", nroDoc: "28456123", nombre: "Mariana López", domicilio: "Las Heras 455", telefono: "381 455-2210", email: "mariana.lopez@correo.test", cuentaCorriente: true, limiteCredito: 40000000 },
  { tipoDoc: "CUIT", nroDoc: "30712345671", nombre: "Constructora Del Norte S.A.", domicilio: "Av. Belgrano 2100", telefono: "381 430-1188", email: "compras@delnorte.test", cuentaCorriente: true, limiteCredito: 150000000 },
  { tipoDoc: "DNI", nroDoc: "33120987", nombre: "Jorge Medina", domicilio: "San Martín 870", telefono: "381 512-3344", cuentaCorriente: true, limiteCredito: 15000000 },
  { tipoDoc: "DNI", nroDoc: "25987654", nombre: "Silvia Paz", domicilio: "Congreso 230", telefono: "381 467-9012", email: "silvia.paz@correo.test", cuentaCorriente: true },
  { tipoDoc: "CUIT", nroDoc: "20301234565", nombre: "Ricardo Gómez (Plomero)", domicilio: "Junín 1450", telefono: "381 598-7766", cuentaCorriente: true, limiteCredito: 25000000 },
  { tipoDoc: "DNI", nroDoc: "40555111", nombre: "Lucía Fernández", domicilio: "Córdoba 640", telefono: "381 600-1122", cuentaCorriente: true, limiteCredito: 8000000 },
  { tipoDoc: "DNI", nroDoc: "31444777", nombre: "Diego Romero", telefono: "381 455-8899", cuentaCorriente: false },
  { tipoDoc: "DNI", nroDoc: "36222333", nombre: "Valeria Castro", email: "valeria.castro@correo.test", cuentaCorriente: false },
  { tipoDoc: "DNI", nroDoc: "29888444", nombre: "Hernán Ibáñez", domicilio: "Maipú 310", cuentaCorriente: false },
  { tipoDoc: "CUIT", nroDoc: "27350001112", nombre: "Carolina Ruiz Diseño", domicilio: "24 de Septiembre 980", telefono: "381 421-5566", cuentaCorriente: false },
];
