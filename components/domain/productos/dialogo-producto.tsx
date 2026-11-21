"use client";

import { useState } from "react";
import { actualizarProductoAction, crearProductoAction } from "@/app/(app)/productos/actions";
import { Campo } from "@/components/comunes/campo";
import { CampoImporte } from "@/components/comunes/campo-importe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormulario } from "@/hooks/use-formulario";
import { crearProductoSchema, editarProductoSchema } from "@/schemas/catalogo";
import type { ProductoPublico } from "@/services/productos";

type Categoria = { id: number; nombre: string };

const aNumero = (v: string) => (v.trim() === "" ? undefined : Number(v));

/** RF-P2: alta y edición de producto en un modal. */
export function DialogoProducto({
  categorias,
  producto,
  disparador,
}: {
  categorias: Categoria[];
  producto?: ProductoPublico;
  disparador: React.ReactNode;
}) {
  const editando = !!producto;
  const inicial = () => ({
    codigo: producto?.codigo ?? "",
    descripcion: producto?.descripcion ?? "",
    categoriaId: producto ? String(producto.categoria.id) : "",
    precio: producto?.precio ?? null,
    stockMinimo: producto ? String(producto.stockMinimo) : "",
    stockInicial: "",
  });
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState(inicial);

  const form = useFormulario({
    schema: editando ? editarProductoSchema : crearProductoSchema,
    accion: (d) => (editando ? actualizarProductoAction(producto!.id, d) : crearProductoAction(d)),
    mensajeExito: editando ? "Producto actualizado." : "Producto creado.",
    onExito: () => setAbierto(false),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    form.enviar({
      codigo: v.codigo,
      descripcion: v.descripcion,
      categoriaId: aNumero(v.categoriaId),
      precio: v.precio ?? undefined,
      stockMinimo: aNumero(v.stockMinimo),
      ...(editando ? {} : { stockInicial: aNumero(v.stockInicial) }),
    });
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(a) => {
        setAbierto(a);
        if (a) {
          setV(inicial());
          form.limpiar();
        }
      }}
    >
      <DialogTrigger asChild>{disparador}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "La existencia no se edita: se modifica con ingresos y egresos."
                : "El stock inicial se registra como un ingreso con motivo «Stock inicial»."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="codigo" etiqueta="Código" error={form.error("codigo")}>
              <Input
                id="codigo"
                value={v.codigo}
                placeholder="HE-001"
                aria-invalid={!!form.error("codigo") || undefined}
                onChange={(e) => setV({ ...v, codigo: e.target.value.toUpperCase() })}
              />
            </Campo>
            <Campo id="descripcion" etiqueta="Descripción" error={form.error("descripcion")} className="sm:col-span-2">
              <Input
                id="descripcion"
                value={v.descripcion}
                aria-invalid={!!form.error("descripcion") || undefined}
                onChange={(e) => setV({ ...v, descripcion: e.target.value })}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="categoriaId" etiqueta="Categoría" error={form.error("categoriaId")}>
              <Select value={v.categoriaId} onValueChange={(c) => setV({ ...v, categoriaId: c })}>
                <SelectTrigger id="categoriaId" className="w-full" aria-invalid={!!form.error("categoriaId") || undefined}>
                  <SelectValue placeholder="Elegí una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="precio" etiqueta="Precio de venta" error={form.error("precio")}>
              <CampoImporte
                id="precio"
                valor={v.precio}
                invalido={!!form.error("precio")}
                onCambio={(c) => setV((x) => ({ ...x, precio: c }))}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="stockMinimo" etiqueta="Stock mínimo" error={form.error("stockMinimo")}>
              <Input
                id="stockMinimo"
                type="number"
                min={0}
                step={1}
                value={v.stockMinimo}
                aria-invalid={!!form.error("stockMinimo") || undefined}
                onChange={(e) => setV({ ...v, stockMinimo: e.target.value })}
              />
            </Campo>
            {!editando && (
              <Campo id="stockInicial" etiqueta="Stock inicial (opcional)" error={form.error("stockInicial")}>
                <Input
                  id="stockInicial"
                  type="number"
                  min={0}
                  step={1}
                  value={v.stockInicial}
                  aria-invalid={!!form.error("stockInicial") || undefined}
                  onChange={(e) => setV({ ...v, stockInicial: e.target.value })}
                />
              </Campo>
            )}
          </div>

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
