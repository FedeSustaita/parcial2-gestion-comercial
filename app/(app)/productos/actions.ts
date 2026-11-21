"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/action";
import { actualizarCategoria, crearCategoria } from "@/services/categorias";
import { actualizarProducto, crearProducto } from "@/services/productos";
import { registrarMovimientoManual } from "@/services/stock";

// Server Actions del módulo Productos: solo llaman al servicio y refrescan
// las pantallas. Ninguna regla de negocio vive acá (sección 10.8, punto 1).

async function conRefresco<T>(r: Promise<T>): Promise<T> {
  const resultado = await r;
  revalidatePath("/productos", "layout");
  return resultado;
}

export async function crearProductoAction(datos: unknown) {
  return ejecutarAccion((u) => conRefresco(crearProducto(u, datos)));
}

export async function actualizarProductoAction(id: number, datos: unknown) {
  return ejecutarAccion((u) => conRefresco(actualizarProducto(u, id, datos)));
}

export async function movimientoStockAction(productoId: number, datos: unknown) {
  return ejecutarAccion((u) => conRefresco(registrarMovimientoManual(u, productoId, datos)));
}

export async function crearCategoriaAction(datos: unknown) {
  return ejecutarAccion((u) => conRefresco(crearCategoria(u, datos)));
}

export async function actualizarCategoriaAction(id: number, datos: unknown) {
  return ejecutarAccion((u) => conRefresco(actualizarCategoria(u, id, datos)));
}
