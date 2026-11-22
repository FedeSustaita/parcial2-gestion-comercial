"use client";

import { Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { anularFacturaAction } from "@/app/(app)/ventas/actions";
import { Campo } from "@/components/comunes/campo";
import { Confirmar } from "@/components/comunes/confirmar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { anularFacturaSchema } from "@/schemas/facturas";

/** RF-V9: anular factura con motivo obligatorio (solo admin; el servidor igual lo verifica). */
export function BotonAnular({ facturaId, numero }: { facturaId: number; numero: string }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string>();

  async function anular() {
    const v = anularFacturaSchema.safeParse({ motivo });
    if (!v.success) {
      setError(v.error.issues[0].message);
      return false; // deja el diálogo abierto
    }
    const r = await anularFacturaAction(facturaId, { motivo });
    if (!r.ok) {
      toast.error(r.error.message);
      return false;
    }
    toast.success(`Factura ${numero} anulada. Se reingresó el stock.`);
    setMotivo("");
  }

  return (
    <Confirmar
      titulo={`¿Anular la factura ${numero}?`}
      descripcion="Se reingresa el stock de cada renglón y, si fue a cuenta corriente, se acredita el total al cliente. No se puede deshacer."
      textoConfirmar="Anular factura"
      onConfirmar={anular}
      disparador={
        <Button variant="destructive" className="print:hidden">
          <Ban /> Anular
        </Button>
      }
    >
      <Campo id="motivo" etiqueta="Motivo de la anulación" error={error}>
        <Textarea
          id="motivo"
          rows={2}
          autoFocus
          value={motivo}
          aria-invalid={!!error || undefined}
          onChange={(e) => {
            setMotivo(e.target.value);
            setError(undefined);
          }}
        />
      </Campo>
    </Confirmar>
  );
}
