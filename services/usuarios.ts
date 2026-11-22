import { randomInt } from "node:crypto";
import { and, asc, count, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { validar } from "@/lib/validacion";
import type { Paginado } from "@/schemas/comunes";
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  listarUsuariosSchema,
} from "@/schemas/usuarios";
import { hashPassword, type UsuarioSesion } from "./auth";
import { exigirRol } from "./permisos";

// Gestión de usuarios (RF-U3, RF-U4, RF-U5). Todo lo de este módulo es solo
// para administradores, salvo crearPrimerAdmin que usa el script de datos.

export type UsuarioPublico = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "vendedor";
  activo: boolean;
  creadoEn: string;
};

// Forma pública: nunca devuelve el hash de la contraseña.
function aPublico(u: typeof usuarios.$inferSelect): UsuarioPublico {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    creadoEn: u.creadoEn.toISOString(),
  };
}

async function emailEnUso(email: string, excepto?: number): Promise<boolean> {
  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.email, email) });
  return !!u && u.id !== excepto;
}

const emailDuplicado = () =>
  new ApiError(409, "EMAIL_DUPLICADO", "Ya existe un usuario con ese email.", [
    { campo: "email", mensaje: "Ya existe un usuario con ese email." },
  ]);

/** RF-U4: listado paginado con búsqueda por nombre o email. */
export async function listarUsuarios(
  usuario: UsuarioSesion,
  query: unknown,
): Promise<Paginado<UsuarioPublico>> {
  const f = validar(listarUsuariosSchema, query);
  exigirRol(usuario, "admin");

  const condiciones: SQL[] = [];
  if (f.q) condiciones.push(or(like(usuarios.nombre, `%${f.q}%`), like(usuarios.email, `%${f.q}%`))!);
  if (f.activo !== undefined) condiciones.push(eq(usuarios.activo, f.activo));
  const where = condiciones.length ? and(...condiciones) : undefined;

  const [filas, [{ total }]] = await Promise.all([
    db
      .select()
      .from(usuarios)
      .where(where)
      .orderBy(asc(usuarios.nombre))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(usuarios).where(where),
  ]);
  return { data: filas.map(aPublico), page: f.page, pageSize: f.pageSize, total };
}

/** RF-U4: alta de usuario con contraseña temporal. */
export async function crearUsuario(usuario: UsuarioSesion, datos: unknown): Promise<UsuarioPublico> {
  const d = validar(crearUsuarioSchema, datos);
  exigirRol(usuario, "admin");
  if (await emailEnUso(d.email)) throw emailDuplicado();

  const [u] = await db
    .insert(usuarios)
    .values({ nombre: d.nombre, email: d.email, rol: d.rol, passwordHash: await hashPassword(d.password) })
    .returning();
  return aPublico(u);
}

/**
 * RF-U4: edición, cambio de rol y desactivación (baja lógica, regla 12).
 * Un admin no puede desactivarse ni quitarse el rol a sí mismo: dejaría el
 * sistema sin administrador.
 */
export async function actualizarUsuario(
  usuario: UsuarioSesion,
  usuarioId: unknown,
  datos: unknown,
): Promise<UsuarioPublico> {
  const d = validar(editarUsuarioSchema, datos);
  exigirRol(usuario, "admin");
  const id = Number(usuarioId);

  const actual = await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
  if (!actual) throw errores.noEncontrado("El usuario");

  if (id === usuario.id && (d.activo === false || (d.rol && d.rol !== "admin"))) {
    throw new ApiError(
      422,
      "OPERACION_SOBRE_SI_MISMO",
      "No podés desactivarte ni quitarte el rol de administrador.",
    );
  }
  if (d.email && (await emailEnUso(d.email, id))) throw emailDuplicado();

  if (Object.keys(d).length === 0) return aPublico(actual);
  const [u] = await db.update(usuarios).set(d).where(eq(usuarios.id, id)).returning();
  return aPublico(u);
}

/** RF-U5: el administrador restablece la contraseña; se muestra una sola vez. */
export async function restablecerPassword(
  usuario: UsuarioSesion,
  usuarioId: unknown,
): Promise<{ passwordTemporal: string }> {
  exigirRol(usuario, "admin");
  const id = Number(usuarioId);
  const actual = await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
  if (!actual) throw errores.noEncontrado("El usuario");

  const passwordTemporal = generarPasswordTemporal();
  await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(passwordTemporal) })
    .where(eq(usuarios.id, id));
  return { passwordTemporal };
}

/**
 * RF-U3: el primer administrador lo crea el script de datos iniciales.
 * Solo funciona si todavía no hay ningún usuario en la base.
 */
export async function crearPrimerAdmin(datos: unknown): Promise<UsuarioPublico> {
  const d = validar(crearUsuarioSchema, { ...(datos as object), rol: "admin" });
  const [{ total }] = await db.select({ total: count() }).from(usuarios);
  if (total > 0) throw new ApiError(409, "EMAIL_DUPLICADO", "Ya hay usuarios cargados.");
  const [u] = await db
    .insert(usuarios)
    .values({ nombre: d.nombre, email: d.email, rol: "admin", passwordHash: await hashPassword(d.password) })
    .returning();
  return aPublico(u);
}

function generarPasswordTemporal(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[randomInt(chars.length)]).join("");
}

/** Lista mínima (id y nombre) para filtrar facturas por vendedor. Ambos roles. */
export async function listarVendedores(_usuario: UsuarioSesion): Promise<{ id: number; nombre: string }[]> {
  return db.select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios).orderBy(asc(usuarios.nombre));
}
