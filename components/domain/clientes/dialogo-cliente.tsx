"use client";

import { useState } from "react";
import { actualizarClienteAction, crearClienteAction } from "@/app/(app)/clientes/actions";
import { Campo } from "@/components/comunes/campo";
import { CampoImporte } from "@/components/comunes/campo-importe";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormulario } from "@/hooks/use-formulario";
import { crearClienteSchema, editarClienteSchema } from "@/schemas/clientes";
import type { ClientePublico } from "@/services/clientes";

/**
 * RF-C2: alta y edición de cliente en un modal. También lo usa Nueva venta
 * para dar de alta al comprador sin perder la venta en curso (RF-V2).
 */
export function DialogoCliente({
  cliente,
  disparador,
  onGuardado,
  abierto: abiertoExterno,
  onAbiertoChange,
}: {
  cliente?: ClientePublico;
  disparador?: React.ReactNode;
  onGuardado?: (c: ClientePublico) => void;
  abierto?: boolean;
  onAbiertoChange?: (a: boolean) => void;
}) {
  const editando = !!cliente;
  const inicial = () => ({
    tipoDoc: cliente?.tipoDoc ?? "DNI",
    nroDoc: cliente?.nroDoc ?? "",
    nombre: cliente?.nombre ?? "",
    domicilio: cliente?.domicilio ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    cuentaCorriente: cliente?.cuentaCorriente ?? false,
    limiteCredito: cliente?.limiteCredito ?? null,
  });
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const abierto = abiertoExterno ?? abiertoInterno;
  const [v, setV] = useState(inicial);

  const form = useFormulario({
    schema: editando ? editarClienteSchema : crearClienteSchema,
    accion: (d) => (editando ? actualizarClienteAction(cliente!.id, d) : crearClienteAction(d)),
    mensajeExito: editando ? "Cliente actualizado." : "Cliente creado.",
    onExito: (c) => {
      cambiarAbierto(false);
      onGuardado?.(c);
    },
  });

  function cambiarAbierto(a: boolean) {
    setAbiertoInterno(a);
    onAbiertoChange?.(a);
    if (a) {
      setV(inicial());
      form.limpiar();
    }
  }

  const texto = (campo: "nroDoc" | "nombre" | "domicilio" | "telefono" | "email", etiqueta: string, extra?: React.ComponentProps<typeof Input>) => (
    <Campo id={`cli-${campo}`} etiqueta={etiqueta} error={form.error(campo)}>
      <Input
        id={`cli-${campo}`}
        value={v[campo]}
        aria-invalid={!!form.error(campo) || undefined}
        onChange={(e) => setV({ ...v, [campo]: e.target.value })}
        {...extra}
      />
    </Campo>
  );

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      {disparador && <DialogTrigger asChild>{disparador}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation(); // no dispara el formulario de la venta si está anidado
            form.enviar({
              ...v,
              domicilio: v.domicilio || null,
              telefono: v.telefono || null,
              email: v.email || null,
              limiteCredito: v.cuentaCorriente ? v.limiteCredito : null,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{editando ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>El documento (DNI o CUIT) no se puede repetir.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="cli-tipoDoc" etiqueta="Tipo" error={form.error("tipoDoc")}>
              <Select value={v.tipoDoc} onValueChange={(t) => setV({ ...v, tipoDoc: t as "DNI" | "CUIT" })}>
                <SelectTrigger id="cli-tipoDoc" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CUIT">CUIT</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
            <div className="sm:col-span-2">{texto("nroDoc", "Número de documento", { inputMode: "numeric", autoFocus: true })}</div>
          </div>
          {texto("nombre", "Nombre o razón social")}
          {texto("domicilio", "Domicilio")}
          <div className="grid gap-4 sm:grid-cols-2">
            {texto("telefono", "Teléfono", { inputMode: "tel" })}
            {texto("email", "Email", { type: "email" })}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="cli-cc"
                checked={v.cuentaCorriente}
                onCheckedChange={(c) => setV({ ...v, cuentaCorriente: c === true })}
              />
              <Label htmlFor="cli-cc">Habilitado para cuenta corriente</Label>
            </div>
            {v.cuentaCorriente && (
              <Campo
                id="cli-limite"
                etiqueta="Límite de crédito (opcional)"
                error={form.error("limiteCredito")}
                ayuda="Vacío = sin límite."
              >
                <CampoImporte
                  id="cli-limite"
                  valor={v.limiteCredito}
                  invalido={!!form.error("limiteCredito")}
                  onCambio={(c) => setV((x) => ({ ...x, limiteCredito: c }))}
                />
              </Campo>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => cambiarAbierto(false)}>
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
