import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios, type Rol } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { demoHabilitado, USUARIOS_DEMO } from "@/lib/demo";
import { validar } from "@/lib/validacion";
import { cambiarPasswordSchema, loginSchema } from "@/schemas/auth";

// Servicio de autenticación. No conoce cookies ni HTTP: devuelve el usuario y
// el adaptador (Route Handler / Server Action) se encarga de la cookie.

/** Forma pública del usuario conectado (nunca incluye el hash). */
export type UsuarioSesion = { id: number; nombre: string; email: string; rol: Rol };

const COSTO_BCRYPT = 10;

/** Seguridad (sección 8): contraseñas con hash bcrypt, nunca en texto plano. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COSTO_BCRYPT);
}

function aSesion(u: typeof usuarios.$inferSelect): UsuarioSesion {
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
}

/**
 * RF-U1 / RF-U4: inicio de sesión con email y contraseña.
 * Mismo error si el email no existe, la contraseña no coincide o el usuario
 * está inactivo (no se revela cuál de las tres falló).
 */
export async function login(datos: unknown): Promise<UsuarioSesion> {
  const { email, password } = validar(loginSchema, datos);
  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.email, email) });
  const ok = u ? await bcrypt.compare(password, u.passwordHash) : false;
  if (!u || !ok || !u.activo) {
    throw new ApiError(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.");
  }
  return aSesion(u);
}

/**
 * Modo demo: inicia sesión como el usuario de prueba del rol elegido, sin
 * contraseña. Usa los mismos usuarios del seed y respeta las mismas reglas:
 * si ese usuario fue desactivado, no entra. Se apaga con DEMO_LOGIN=false.
 */
export async function loginDemo(rol: unknown): Promise<UsuarioSesion> {
  if (!demoHabilitado()) throw errores.sinPermiso();
  if (rol !== "admin" && rol !== "vendedor") throw errores.validacion([{ campo: "rol", mensaje: "Rol inválido." }]);
  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.email, USUARIOS_DEMO[rol].email) });
  if (!u || !u.activo || u.rol !== rol) {
    throw new ApiError(401, "CREDENCIALES_INVALIDAS", "El usuario de prueba no está disponible.");
  }
  return aSesion(u);
}

/**
 * RF-U2 / sección 10.5: el usuario se resuelve contra la base EN CADA PEDIDO.
 * Si fue desactivado (o borrado), pierde el acceso aunque conserve la cookie.
 */
export async function usuarioDeSesion(usuarioId: number): Promise<UsuarioSesion | null> {
  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.id, usuarioId) });
  return u && u.activo ? aSesion(u) : null;
}

/** RF-U5: cada usuario cambia su propia contraseña. */
export async function cambiarPassword(usuario: UsuarioSesion, datos: unknown): Promise<void> {
  const { actual, nueva } = validar(cambiarPasswordSchema, datos);
  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.id, usuario.id) });
  if (!u || !(await bcrypt.compare(actual, u.passwordHash))) {
    throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.", [
      { campo: "actual", mensaje: "La contraseña actual no es correcta." },
    ]);
  }
  await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(nueva) })
    .where(eq(usuarios.id, usuario.id));
}
