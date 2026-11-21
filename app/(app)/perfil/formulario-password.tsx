"use client";

import { useState } from "react";
import { Campo } from "@/components/comunes/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormulario } from "@/hooks/use-formulario";
import { cambiarPasswordSchema } from "@/schemas/auth";
import { cambiarPasswordAction } from "./actions";

const VACIO = { actual: "", nueva: "", confirmacion: "" };

export function FormularioPassword() {
  const [valores, setValores] = useState(VACIO);
  const form = useFormulario({
    schema: cambiarPasswordSchema,
    accion: cambiarPasswordAction,
    mensajeExito: "Contraseña actualizada.",
    onExito: () => setValores(VACIO),
  });

  const campo = (nombre: keyof typeof VACIO, etiqueta: string, autoComplete: string) => (
    <Campo id={nombre} etiqueta={etiqueta} error={form.error(nombre)}>
      <Input
        id={nombre}
        type="password"
        autoComplete={autoComplete}
        value={valores[nombre]}
        aria-invalid={!!form.error(nombre) || undefined}
        onChange={(e) => setValores({ ...valores, [nombre]: e.target.value })}
      />
    </Campo>
  );

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.enviar(valores);
      }}
    >
      {campo("actual", "Contraseña actual", "current-password")}
      {campo("nueva", "Contraseña nueva", "new-password")}
      {campo("confirmacion", "Repetir contraseña nueva", "new-password")}
      <Button type="submit" disabled={form.enviando} className="self-start">
        {form.enviando ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
