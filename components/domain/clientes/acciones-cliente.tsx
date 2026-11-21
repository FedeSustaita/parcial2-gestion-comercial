"use client";

import { HandCoins, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { actualizarClienteAction } from "@/app/(app)/clientes/actions";
import { Confirmar } from "@/components/comunes/confirmar";
import { Button } from "@/components/ui/button";
import type { ClientePublico } from "@/services/clientes";
import { DialogoCliente } from "./dialogo-cliente";
import { DialogoPago } from "./dialogo-pago";

/** Acciones de la ficha del cliente (ambos roles, sección 3). */
export function AccionesCliente({ cliente }: { cliente: ClientePublico }) {
  async function cambiarEstado() {
    const r = await actualizarClienteAction(cliente.id, { activo: !cliente.activo });
    if (r.ok) toast.success(cliente.activo ? "Cliente dado de baja." : "Cliente reactivado.");
    else toast.error(r.error.message);
  }

  return (
    <>
      {cliente.cuentaCorriente && cliente.saldo > 0 && (
        <DialogoPago
          clienteId={cliente.id}
          saldo={cliente.saldo}
          disparador={
            <Button>
              <HandCoins /> Registrar pago
            </Button>
          }
        />
      )}
      <DialogoCliente
        cliente={cliente}
        disparador={
          <Button variant="outline">
            <Pencil /> Editar
          </Button>
        }
      />
      <Confirmar
        titulo={cliente.activo ? "¿Dar de baja al cliente?" : "¿Reactivar al cliente?"}
        descripcion={
          cliente.activo
            ? "Deja de aparecer en las búsquedas, pero conserva su historial. No se puede si tiene saldo pendiente."
            : undefined
        }
        textoConfirmar={cliente.activo ? "Dar de baja" : "Reactivar"}
        destructivo={cliente.activo}
        onConfirmar={cambiarEstado}
        disparador={
          <Button variant={cliente.activo ? "ghost" : "outline"} className={cliente.activo ? "text-destructive" : ""}>
            <Power /> {cliente.activo ? "Dar de baja" : "Reactivar"}
          </Button>
        }
      />
    </>
  );
}
