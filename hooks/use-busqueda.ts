"use client";

import { useEffect, useState } from "react";

/**
 * Búsqueda en vivo contra la API REST (sección 10.6): espera 250 ms entre
 * teclas y cancela el pedido anterior si el usuario sigue escribiendo.
 */
export function useBusqueda<T>(url: string | null) {
  const [resultados, setResultados] = useState<T[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    const control = new AbortController();
    const t = setTimeout(async () => {
      setCargando(true);
      setError(false);
      try {
        const r = await fetch(url, { signal: control.signal });
        if (!r.ok) throw new Error(String(r.status));
        const json = await r.json();
        setResultados(json.data ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      } finally {
        if (!control.signal.aborted) setCargando(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      control.abort();
    };
  }, [url]);

  return { resultados: url ? resultados : [], cargando: !!url && cargando, error };
}
