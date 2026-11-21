"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { centavosATexto, pesosACentavos } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Campo de importe: el usuario escribe pesos ("12.345,50") y el componente
 * entrega centavos enteros (regla 10). `null` si el texto no es válido.
 */
export function CampoImporte({
  id,
  valor,
  onCambio,
  invalido,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  valor: number | null;
  onCambio: (centavos: number | null) => void;
  invalido?: boolean;
}) {
  const [texto, setTexto] = useState(centavosATexto(valor));

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        aria-invalid={invalido || undefined}
        onChange={(e) => {
          setTexto(e.target.value);
          onCambio(pesosACentavos(e.target.value));
        }}
        onBlur={() => {
          const c = pesosACentavos(texto);
          if (c != null) setTexto(centavosATexto(c));
        }}
        className={cn("pl-7 text-right tabular-nums", className)}
        {...props}
      />
    </div>
  );
}
