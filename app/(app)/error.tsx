"use client";

import { EstadoError } from "@/components/comunes/estados";
import { Button } from "@/components/ui/button";

// Estado de error común: se muestra si una página falla al cargar.
export default function ErrorPagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <EstadoError
      accion={
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
      }
    />
  );
}
