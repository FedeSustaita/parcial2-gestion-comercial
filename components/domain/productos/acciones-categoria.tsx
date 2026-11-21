"use client";

import { Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { actualizarCategoriaAction } from "@/app/(app)/productos/actions";
import { Confirmar } from "@/components/comunes/confirmar";
import { Button } from "@/components/ui/button";
import type { CategoriaPublica } from "@/services/categorias";
import { DialogoCategoria } from "./dialogo-categoria";

export function AccionesCategoria({ categoria }: { categoria: CategoriaPublica }) {
  async function cambiarEstado() {
    const r = await actualizarCategoriaAction(categoria.id, { activa: !categoria.activa });
    if (r.ok) toast.success(categoria.activa ? "Categoría desactivada." : "Categoría activada.");
    else toast.error(r.error.message);
  }
  return (
    <div className="flex justify-end gap-1">
      <DialogoCategoria
        categoria={categoria}
        disparador={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${categoria.nombre}`}>
            <Pencil />
          </Button>
        }
      />
      <Confirmar
        titulo={categoria.activa ? `¿Desactivar «${categoria.nombre}»?` : `¿Activar «${categoria.nombre}»?`}
        descripcion={categoria.activa ? "Solo se puede desactivar si no tiene productos activos." : undefined}
        textoConfirmar={categoria.activa ? "Desactivar" : "Activar"}
        destructivo={categoria.activa}
        onConfirmar={cambiarEstado}
        disparador={
          <Button variant="ghost" size="icon-sm" aria-label={categoria.activa ? "Desactivar" : "Activar"}>
            <Power className={categoria.activa ? "text-destructive" : "text-emerald-600"} />
          </Button>
        }
      />
    </div>
  );
}
