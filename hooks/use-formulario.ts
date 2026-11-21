"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import type { ResultadoAccion } from "@/lib/action";

type Errores = Record<string, string>;

/**
 * Hook común de formularios (sección 10.6):
 * 1. Valida en el cliente con el MISMO esquema Zod que usa el servidor.
 * 2. Si pasa, llama a la Server Action; el servidor vuelve a validar todo.
 * 3. Muestra los errores por campo (primero los de Zod, después los del
 *    servidor), maneja el estado de envío y avisa el resultado con un toast.
 */
export function useFormulario<S extends z.ZodType, T>({
  schema,
  accion,
  mensajeExito,
  onExito,
}: {
  schema?: S;
  accion: (datos: unknown) => Promise<ResultadoAccion<T>>;
  mensajeExito?: string | ((data: T) => string);
  onExito?: (data: T) => void;
}) {
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(valores: unknown): Promise<boolean> {
    if (schema) {
      const r = schema.safeParse(valores);
      if (!r.success) {
        setErrores(aErrores(r.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }))));
        return false;
      }
    }
    setErrores({});
    setEnviando(true);
    try {
      const r = await accion(valores);
      if (!r.ok) {
        const detalles = Array.isArray(r.error.details) ? (r.error.details as { campo?: string; mensaje?: string }[]) : [];
        const porCampo = detalles.filter((d) => d.campo && d.mensaje) as { campo: string; mensaje: string }[];
        if (porCampo.length) setErrores(aErrores(porCampo));
        toast.error(r.error.message);
        return false;
      }
      if (mensajeExito) toast.success(typeof mensajeExito === "function" ? mensajeExito(r.data) : mensajeExito);
      onExito?.(r.data);
      return true;
    } catch {
      toast.error("No se pudo completar la operación. Revisá tu conexión.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return {
    errores,
    enviando,
    enviar,
    error: (campo: string) => errores[campo],
    limpiar: () => setErrores({}),
  };
}

function aErrores(lista: { campo: string; mensaje: string }[]): Errores {
  const e: Errores = {};
  for (const { campo, mensaje } of lista) if (!e[campo]) e[campo] = mensaje;
  return e;
}
