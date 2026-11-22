"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/action";
import { anularFactura } from "@/services/facturas";

// RF-V9: anulación desde el comprobante. La emisión la hace la pantalla de
// Nueva venta llamando a POST /api/facturas (sección 10.6).
export async function anularFacturaAction(id: number, datos: unknown) {
  return ejecutarAccion(async (u) => {
    const r = await anularFactura(u, id, datos);
    revalidatePath("/", "layout");
    return r;
  });
}
