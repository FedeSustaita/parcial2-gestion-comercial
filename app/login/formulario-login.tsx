"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction } from "@/app/actions/sesion";
import { Campo } from "@/components/comunes/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormulario } from "@/hooks/use-formulario";
import { loginSchema } from "@/schemas/auth";

export function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [valores, setValores] = useState({ email: "", password: "" });
  const form = useFormulario({
    schema: loginSchema,
    accion: loginAction,
    onExito: () => {
      router.replace(destino);
      router.refresh();
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.enviar(valores);
      }}
    >
      <Campo id="email" etiqueta="Email" error={form.error("email")}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          value={valores.email}
          aria-invalid={!!form.error("email") || undefined}
          onChange={(e) => setValores({ ...valores, email: e.target.value })}
        />
      </Campo>
      <Campo id="password" etiqueta="Contraseña" error={form.error("password")}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={valores.password}
          aria-invalid={!!form.error("password") || undefined}
          onChange={(e) => setValores({ ...valores, password: e.target.value })}
        />
      </Campo>
      <Button type="submit" disabled={form.enviando}>
        {form.enviando ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
