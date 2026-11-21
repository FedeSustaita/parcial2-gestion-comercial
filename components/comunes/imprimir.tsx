"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botón que abre el diálogo de impresión del navegador (no se imprime a sí mismo). */
export function BotonImprimir({ texto = "Imprimir" }: { texto?: string }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer /> {texto}
    </Button>
  );
}
