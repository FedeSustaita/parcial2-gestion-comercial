// Usuarios de prueba (uno por rol). Los crea el script de datos iniciales y
// los usan los botones de "modo demo" del login, para que el profesor pueda
// entrar sin escribir usuario ni contraseña.
// El modo demo se puede apagar con la variable de entorno DEMO_LOGIN=false.

export const USUARIOS_DEMO = {
  admin: { nombre: "Laura Méndez", email: "admin@comercio.test", password: "admin1234" },
  vendedor: { nombre: "Pablo Ruiz", email: "vendedor@comercio.test", password: "vendedor1234" },
} as const;

export function demoHabilitado(): boolean {
  return process.env.DEMO_LOGIN !== "false";
}
