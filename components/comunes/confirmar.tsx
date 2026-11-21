"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmación de acciones irreversibles (sección 8): anular, dar de baja,
 * desactivar. `onConfirmar` puede devolver false para dejar el diálogo
 * abierto (p. ej. si falta el motivo). `children` permite agregar campos.
 */
export function Confirmar({
  disparador,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  destructivo = true,
  onConfirmar,
  children,
}: {
  disparador: React.ReactNode;
  titulo: string;
  descripcion?: React.ReactNode;
  textoConfirmar?: string;
  destructivo?: boolean;
  onConfirmar: () => Promise<boolean | void> | boolean | void;
  children?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    try {
      const r = await onConfirmar();
      if (r !== false) setAbierto(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild>{disparador}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descripcion && <AlertDialogDescription>{descripcion}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
          <Button variant={destructivo ? "destructive" : "default"} onClick={confirmar} disabled={enviando}>
            {enviando ? "Procesando…" : textoConfirmar}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
