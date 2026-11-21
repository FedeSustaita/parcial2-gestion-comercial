import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categorias, productos } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { validar } from "@/lib/validacion";
import { crearCategoriaSchema, editarCategoriaSchema } from "@/schemas/catalogo";
import type { UsuarioSesion } from "./auth";
import { esAdmin, exigirRol } from "./permisos";

// Categorías de productos (RF-P7): alta, edición y baja lógica simples.

export type CategoriaPublica = {
  id: number;
  nombre: string;
  activa: boolean;
  productosActivos: number;
};

const nombreDuplicado = () =>
  new ApiError(409, "NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.", [
    { campo: "nombre", mensaje: "Ya existe una categoría con ese nombre." },
  ]);

async function nombreEnUso(nombre: string, excepto?: number) {
  const c = await db.query.categorias.findFirst({
    where: sql`lower(${categorias.nombre}) = lower(${nombre})`,
  });
  return !!c && c.id !== excepto;
}

/**
 * RF-P7: GET /api/categorias devuelve las activas, sin paginar.
 * El admin puede pedir también las inactivas (`todas`) para administrarlas.
 */
export async function listarCategorias(
  usuario: UsuarioSesion,
  opciones: { todas?: boolean } = {},
): Promise<CategoriaPublica[]> {
  const todas = opciones.todas && esAdmin(usuario);
  return db
    .select({
      id: categorias.id,
      nombre: categorias.nombre,
      activa: categorias.activa,
      productosActivos: count(productos.id),
    })
    .from(categorias)
    .leftJoin(productos, and(eq(productos.categoriaId, categorias.id), eq(productos.activo, true)))
    .where(todas ? undefined : eq(categorias.activa, true))
    .groupBy(categorias.id)
    .orderBy(asc(categorias.nombre));
}

/** RF-P7: alta (admin). */
export async function crearCategoria(usuario: UsuarioSesion, datos: unknown): Promise<CategoriaPublica> {
  const d = validar(crearCategoriaSchema, datos);
  exigirRol(usuario, "admin");
  if (await nombreEnUso(d.nombre)) throw nombreDuplicado();
  const [c] = await db.insert(categorias).values({ nombre: d.nombre }).returning();
  return { id: c.id, nombre: c.nombre, activa: c.activa, productosActivos: 0 };
}

/**
 * RF-P7: edición y baja lógica (admin). No se puede desactivar una categoría
 * que todavía tiene productos activos → 409 CATEGORIA_EN_USO.
 */
export async function actualizarCategoria(
  usuario: UsuarioSesion,
  categoriaId: unknown,
  datos: unknown,
): Promise<CategoriaPublica> {
  const d = validar(editarCategoriaSchema, datos);
  exigirRol(usuario, "admin");
  const id = Number(categoriaId);

  const actual = await db.query.categorias.findFirst({ where: eq(categorias.id, id) });
  if (!actual) throw errores.noEncontrado("La categoría");
  if (d.nombre && (await nombreEnUso(d.nombre, id))) throw nombreDuplicado();

  const [{ activos }] = await db
    .select({ activos: count() })
    .from(productos)
    .where(and(eq(productos.categoriaId, id), eq(productos.activo, true)));
  if (d.activa === false && activos > 0) {
    throw new ApiError(
      409,
      "CATEGORIA_EN_USO",
      `La categoría tiene ${activos} producto(s) activo(s). Movelos o dalos de baja primero.`,
    );
  }

  const [c] = Object.keys(d).length
    ? await db.update(categorias).set(d).where(eq(categorias.id, id)).returning()
    : [actual];
  return { id: c.id, nombre: c.nombre, activa: c.activa, productosActivos: activos };
}
