import { and, asc, count, eq, like, lt, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categorias, productos } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { validar } from "@/lib/validacion";
import { crearProductoSchema, editarProductoSchema, listarProductosSchema } from "@/schemas/catalogo";
import type { Paginado } from "@/schemas/comunes";
import type { UsuarioSesion } from "./auth";
import { esAdmin, exigirRol } from "./permisos";
import { moverStock } from "./stock";

// Catálogo de productos (RF-P1, RF-P2, RF-P3).

export type ProductoPublico = {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: { id: number; nombre: string };
  precio: number; // centavos
  existencia: number;
  stockMinimo: number;
  bajoMinimo: boolean;
  activo: boolean;
};

// "Bajo el stock mínimo": existencia menor que el mínimo configurado.
const condicionBajoMinimo = lt(productos.existencia, productos.stockMinimo);

const seleccion = {
  id: productos.id,
  codigo: productos.codigo,
  descripcion: productos.descripcion,
  precio: productos.precio,
  existencia: productos.existencia,
  stockMinimo: productos.stockMinimo,
  activo: productos.activo,
  categoriaId: categorias.id,
  categoriaNombre: categorias.nombre,
};

type Fila = { [K in keyof typeof seleccion]: (typeof seleccion)[K]["_"]["data"] };

function aPublico(f: Fila): ProductoPublico {
  return {
    id: f.id,
    codigo: f.codigo,
    descripcion: f.descripcion,
    categoria: { id: f.categoriaId, nombre: f.categoriaNombre },
    precio: f.precio,
    existencia: f.existencia,
    stockMinimo: f.stockMinimo,
    bajoMinimo: f.existencia < f.stockMinimo,
    activo: f.activo,
  };
}

function consulta(where: SQL | undefined) {
  return db.select(seleccion).from(productos).innerJoin(categorias, eq(productos.categoriaId, categorias.id)).where(where);
}

/**
 * RF-P1: listado paginado. Búsqueda por código o descripción, filtro por
 * categoría y por "bajo mínimo". Por defecto solo activos; el admin puede
 * pedir también los inactivos (activo=false o activo=todos).
 */
export async function listarProductos(usuario: UsuarioSesion, query: unknown): Promise<Paginado<ProductoPublico>> {
  const f = validar(listarProductosSchema, query ?? {});
  const activo = esAdmin(usuario) ? f.activo : "true";

  const condiciones: SQL[] = [];
  if (f.q) condiciones.push(or(like(productos.codigo, `%${f.q}%`), like(productos.descripcion, `%${f.q}%`))!);
  if (f.categoriaId) condiciones.push(eq(productos.categoriaId, f.categoriaId));
  if (f.bajoMinimo) condiciones.push(condicionBajoMinimo);
  if (activo !== "todos") condiciones.push(eq(productos.activo, activo === "true"));
  const where = condiciones.length ? and(...condiciones) : undefined;

  const [filas, [{ total }]] = await Promise.all([
    consulta(where)
      .orderBy(asc(productos.codigo))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(productos).where(where),
  ]);
  return { data: filas.map(aPublico), page: f.page, pageSize: f.pageSize, total };
}

/** RF-P1: un producto por id; 404 si no existe. */
export async function obtenerProducto(_usuario: UsuarioSesion, productoId: unknown): Promise<ProductoPublico> {
  const [f] = await consulta(eq(productos.id, Number(productoId)));
  if (!f) throw errores.noEncontrado("El producto");
  return aPublico(f);
}

/** RF-T1: cantidad de productos activos bajo el mínimo (para el tablero). */
export async function contarBajoMinimo(): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(productos)
    .where(and(eq(productos.activo, true), condicionBajoMinimo));
  return total;
}

const codigoDuplicado = () =>
  new ApiError(409, "CODIGO_DUPLICADO", "Ya existe un producto con ese código.", [
    { campo: "codigo", mensaje: "Ya existe un producto con ese código." },
  ]);

async function codigoEnUso(codigo: string, excepto?: number) {
  const p = await db.query.productos.findFirst({ where: eq(productos.codigo, codigo) });
  return !!p && p.id !== excepto;
}

async function validarCategoria(categoriaId: number) {
  const c = await db.query.categorias.findFirst({ where: eq(categorias.id, categoriaId) });
  if (!c || !c.activa) throw errores.validacion([{ campo: "categoriaId", mensaje: "La categoría no existe o está inactiva." }]);
}

/**
 * RF-P2: alta (admin). El producto nace con existencia 0; si viene
 * `stockInicial`, se registra un ingreso "Stock inicial" vía moverStock()
 * en la MISMA transacción (regla 2).
 */
export async function crearProducto(usuario: UsuarioSesion, datos: unknown): Promise<ProductoPublico> {
  const d = validar(crearProductoSchema, datos);
  exigirRol(usuario, "admin");
  if (await codigoEnUso(d.codigo)) throw codigoDuplicado();
  await validarCategoria(d.categoriaId);

  const id = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(productos)
      .values({
        codigo: d.codigo,
        descripcion: d.descripcion,
        categoriaId: d.categoriaId,
        precio: d.precio,
        stockMinimo: d.stockMinimo,
      })
      .returning({ id: productos.id });
    if (d.stockInicial && d.stockInicial > 0) {
      await moverStock(tx, {
        productoId: p.id,
        tipo: "ingreso",
        cantidad: d.stockInicial,
        motivo: "Stock inicial",
        usuarioId: usuario.id,
      });
    }
    return p.id;
  });
  return obtenerProducto(usuario, id);
}

/**
 * RF-P2 / RF-P3: edición y baja lógica (admin). El esquema es estricto: si
 * llega `existencia` responde 422 (la existencia solo cambia por movimientos).
 * Cambiar el precio no altera facturas emitidas (regla 3: el precio se copia
 * a cada renglón al facturar).
 */
export async function actualizarProducto(
  usuario: UsuarioSesion,
  productoId: unknown,
  datos: unknown,
): Promise<ProductoPublico> {
  const d = validar(editarProductoSchema, datos);
  exigirRol(usuario, "admin");
  const id = Number(productoId);

  const actual = await db.query.productos.findFirst({ where: eq(productos.id, id) });
  if (!actual) throw errores.noEncontrado("El producto");
  if (d.codigo && (await codigoEnUso(d.codigo, id))) throw codigoDuplicado();
  if (d.categoriaId && d.categoriaId !== actual.categoriaId) await validarCategoria(d.categoriaId);

  if (Object.keys(d).length) await db.update(productos).set(d).where(eq(productos.id, id));
  return obtenerProducto(usuario, id);
}
