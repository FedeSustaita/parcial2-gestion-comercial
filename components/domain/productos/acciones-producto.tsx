"use client";

import { ArrowDownToLine, ArrowUpFromLine, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { actualizarProductoAction } from "@/app/(app)/productos/actions";
import { Confirmar } from "@/components/comunes/confirmar";
import { Button } from "@/components/ui/button";
import type { ProductoPublico } from "@/services/productos";
import { DialogoMovimiento } from "./dialogo-movimiento";
import { DialogoProducto } from "./dialogo-producto";

/** Botones de la ficha del producto (solo se muestran al admin; el servidor igual verifica). */
export function AccionesProducto({
  producto,
  categorias,
}: {
  producto: ProductoPublico;
  categorias: { id: number; nombre: string }[];
}) {
  async function cambiarEstado() {
    const r = await actualizarProductoAction(producto.id, { activo: !producto.activo });
    if (r.ok) toast.success(producto.activo ? "Producto dado de baja." : "Producto reactivado.");
    else toast.error(r.error.message);
  }

  return (
    <>
      {producto.activo && (
        <>
          <DialogoMovimiento
            productoId={producto.id}
            existencia={producto.existencia}
            tipo="ingreso"
            disparador={
              <Button>
                <ArrowDownToLine /> Ingreso
              </Button>
            }
          />
          <DialogoMovimiento
            productoId={producto.id}
            existencia={producto.existencia}
            tipo="egreso"
            disparador={
              <Button variant="outline">
                <ArrowUpFromLine /> Egreso
              </Button>
            }
          />
        </>
      )}
      <DialogoProducto
        categorias={categorias}
        producto={producto}
        disparador={
          <Button variant="outline">
            <Pencil /> Editar
          </Button>
        }
      />
      <Confirmar
        titulo={producto.activo ? "¿Dar de baja el producto?" : "¿Reactivar el producto?"}
        descripcion={
          producto.activo
            ? "Deja de ofrecerse en ventas, pero conserva su historial de movimientos y facturas."
            : "Vuelve a estar disponible para vender."
        }
        textoConfirmar={producto.activo ? "Dar de baja" : "Reactivar"}
        destructivo={producto.activo}
        onConfirmar={cambiarEstado}
        disparador={
          <Button variant={producto.activo ? "ghost" : "outline"} className={producto.activo ? "text-destructive" : ""}>
            <Power /> {producto.activo ? "Dar de baja" : "Reactivar"}
          </Button>
        }
      />
    </>
  );
}
