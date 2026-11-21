"use client";

import { useState } from "react";
import { actualizarCategoriaAction, crearCategoriaAction } from "@/app/(app)/productos/actions";
import { Campo } from "@/components/comunes/campo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFormulario } from "@/hooks/use-formulario";
import { crearCategoriaSchema } from "@/schemas/catalogo";

/** RF-P7: alta y edición de categoría. */
export function DialogoCategoria({
  categoria,
  disparador,
}: {
  categoria?: { id: number; nombre: string };
  disparador: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const form = useFormulario({
    schema: crearCategoriaSchema,
    accion: (d) => (categoria ? actualizarCategoriaAction(categoria.id, d) : crearCategoriaAction(d)),
    mensajeExito: categoria ? "Categoría actualizada." : "Categoría creada.",
    onExito: () => setAbierto(false),
  });

  return (
    <Dialog
      open={abierto}
      onOpenChange={(a) => {
        setAbierto(a);
        if (a) {
          setNombre(categoria?.nombre ?? "");
          form.limpiar();
        }
      }}
    >
      <DialogTrigger asChild>{disparador}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.enviar({ nombre });
          }}
        >
          <DialogHeader>
            <DialogTitle>{categoria ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <Campo id="nombre" etiqueta="Nombre" error={form.error("nombre")}>
            <Input
              id="nombre"
              autoFocus
              value={nombre}
              aria-invalid={!!form.error("nombre") || undefined}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.enviando}>
              {form.enviando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
