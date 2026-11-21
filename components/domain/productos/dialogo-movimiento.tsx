"use client";

import { useState } from "react";
import { movimientoStockAction } from "@/app/(app)/productos/actions";
import { Campo } from "@/components/comunes/campo";
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
import { Textarea } from "@/components/ui/textarea";
import { useFormulario } from "@/hooks/use-formulario";
import { MOTIVOS_EGRESO, MOTIVOS_INGRESO, movimientoManualSchema } from "@/schemas/catalogo";

/** RF-P4 / RF-P5: ingreso o egreso manual de stock (admin). */
export function DialogoMovimiento({
  productoId,
  existencia,
  tipo,
  disparador,
}: {
  productoId: number;
  existencia: number;
  tipo: "ingreso" | "egreso";
  disparador: React.ReactNode;
}) {
  const vacio = { cantidad: "", motivo: tipo === "ingreso" ? "Reposición" : "", observacion: "" };
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState(vacio);
  const motivos = tipo === "ingreso" ? MOTIVOS_INGRESO : MOTIVOS_EGRESO;

  const form = useFormulario({
    schema: movimientoManualSchema,
    accion: (d) => movimientoStockAction(productoId, d),
    mensajeExito: (m) => `${tipo === "ingreso" ? "Ingreso" : "Egreso"} registrado. Existencia: ${m.existenciaResultante}.`,
    onExito: () => setAbierto(false),
  });

  const cantidad = Number(v.cantidad) || 0;
  const resultante = existencia + (tipo === "ingreso" ? cantidad : -cantidad);

  return (
    <Dialog
      open={abierto}
      onOpenChange={(a) => {
        setAbierto(a);
        if (a) {
          setV(vacio);
          form.limpiar();
        }
      }}
    >
      <DialogTrigger asChild>{disparador}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.enviar({
              tipo,
              cantidad: v.cantidad === "" ? undefined : Number(v.cantidad),
              motivo: v.motivo,
              observacion: v.observacion || undefined,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{tipo === "ingreso" ? "Ingreso de stock" : "Egreso de stock"}</DialogTitle>
            <DialogDescription>
              Existencia actual: {existencia}. Después del movimiento: {" "}
              <span className={resultante < 0 ? "font-medium text-destructive" : "font-medium text-foreground"}>
                {resultante}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Campo id="cantidad" etiqueta="Cantidad" error={form.error("cantidad")}>
            <Input
              id="cantidad"
              type="number"
              min={1}
              step={1}
              autoFocus
              value={v.cantidad}
              aria-invalid={!!form.error("cantidad") || undefined}
              onChange={(e) => setV({ ...v, cantidad: e.target.value })}
            />
          </Campo>
          <Campo id="motivo" etiqueta="Motivo" error={form.error("motivo")}>
            <Select value={v.motivo} onValueChange={(m) => setV({ ...v, motivo: m })}>
              <SelectTrigger id="motivo" className="w-full" aria-invalid={!!form.error("motivo") || undefined}>
                <SelectValue placeholder="Elegí un motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="observacion" etiqueta="Observación (opcional)" error={form.error("observacion")}>
            <Textarea
              id="observacion"
              rows={2}
              value={v.observacion}
              onChange={(e) => setV({ ...v, observacion: e.target.value })}
            />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.enviando}>
              {form.enviando ? "Guardando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
