"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/action";
import { actualizarCliente, crearCliente } from "@/services/clientes";
import { registrarPago } from "@/services/pagos";

// Server Actions del módulo Clientes: solo adaptan, las reglas están en los servicios.

async function conRefresco<T>(r: Promise<T>): Promise<T> {
  const resultado = await r;
  revalidatePath("/clientes", "layout");
  return resultado;
}

export async function crearClienteAction(datos: unknown) {
  return ejecutarAccion((u) => conRefresco(crearCliente(u, datos)));
}

export async function actualizarClienteAction(id: number, datos: unknown) {
  return ejecutarAccion((u) => conRefresco(actualizarCliente(u, id, datos)));
}

export async function registrarPagoAction(clienteId: number, datos: unknown) {
  return ejecutarAccion((u) => conRefresco(registrarPago(u, clienteId, datos)));
}
