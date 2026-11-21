import "dotenv/config";

// Script de datos iniciales (regla 10.7): crea usuarios, categorías, productos,
// clientes y facturas usando los mismos servicios de la aplicación.
// Se completa en la Etapa 5; el primer administrador (RF-U3) en la Etapa 1.
async function main() {
  console.log("Seed: todavía no hay datos para cargar.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
