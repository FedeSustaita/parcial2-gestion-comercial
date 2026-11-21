import "dotenv/config";
import { db } from "./index";
import { crearPrimerAdmin } from "../services/usuarios";
import { crearUsuario } from "../services/usuarios";
import type { UsuarioSesion } from "../services/auth";

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

  // Etapas siguientes: categorías, productos, clientes, facturas y pagos.
  console.log("Seed completo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
