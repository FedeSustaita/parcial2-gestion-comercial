"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { registrarPagoAction } from "@/app/(app)/clientes/actions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormulario } from "@/hooks/use-formulario";
import { ETIQUETAS, formatearMoneda } from "@/lib/format";
import { registrarPagoSchema } from "@/schemas/clientes";

/** RF-C5: registrar pago a cuenta. Al confirmar abre el recibo imprimible. */
export function DialogoPago({
  clienteId,
  saldo,
  disparador,
}: {
  clienteId: number;
  saldo: number;
  disparador: React.ReactNode;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState(0); // fuerza a reiniciar el campo de importe
  const [v, setV] = useState({ importe: null as number | null, medio: "efectivo", observacion: "" });
  const form = useFormulario({
    schema: registrarPagoSchema,
    accion: (d) => registrarPagoAction(clienteId, d),
    mensajeExito: (r) => `Pago registrado. Recibo ${r.numeroRecibo}.`,
    onExito: (r) => {
      setAbierto(false);
      router.push(`/clientes/recibos/${r.id}`);
    },
  });

  return (
    <Dialog
      open={abierto}
      onOpenChange={(a) => {
        setAbierto(a);
        if (a) {
          setV({ importe: null, medio: "efectivo", observacion: "" });
          setClave((k) => k + 1);
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
            form.enviar({ importe: v.importe ?? undefined, medio: v.medio, observacion: v.observacion || undefined });
          }}
        >
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>Deuda actual: {formatearMoneda(saldo)}. El pago no puede superarla.</DialogDescription>
          </DialogHeader>
          <Campo id="pago-importe" etiqueta="Importe" error={form.error("importe")}>
            <div className="flex gap-2">
              <div className="flex-1">
                <CampoImporte
                  key={clave}
                  id="pago-importe"
                  autoFocus
                  valor={v.importe}
                  invalido={!!form.error("importe")}
                  onCambio={(c) => setV((x) => ({ ...x, importe: c }))}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setV((x) => ({ ...x, importe: saldo }));
                  setClave((k) => k + 1);
                }}
              >
                Saldo total
              </Button>
            </div>
          </Campo>
          <Campo id="pago-medio" etiqueta="Medio de pago" error={form.error("medio")}>
            <Select value={v.medio} onValueChange={(m) => setV({ ...v, medio: m })}>
              <SelectTrigger id="pago-medio" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ETIQUETAS.medioPago).map(([valor, texto]) => (
                  <SelectItem key={valor} value={valor}>
                    {texto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="pago-obs" etiqueta="Observación (opcional)" error={form.error("observacion")}>
            <Textarea id="pago-obs" rows={2} value={v.observacion} onChange={(e) => setV({ ...v, observacion: e.target.value })} />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.enviando}>
              {form.enviando ? "Registrando…" : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
