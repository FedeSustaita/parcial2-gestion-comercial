"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Filtros de listados. Búsqueda, filtros y paginado viven en la URL
// (sección 10.6): el listado se puede recargar y compartir.

/** Cambia un parámetro de la URL y vuelve a la página 1. */
export function useParametroUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendiente, iniciar] = useTransition();

  function cambiar(nombre: string, valor: string | null | undefined) {
    const q = new URLSearchParams(params);
    if (valor) q.set(nombre, valor);
    else q.delete(nombre);
    q.delete("page");
    const s = q.toString();
    iniciar(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  }
  return { valor: (n: string) => params.get(n) ?? "", cambiar, pendiente };
}

/** Barra contenedora de filtros. */
export function BarraFiltros({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-3", className)}>{children}</div>;
}

/** Búsqueda de texto con espera de 300 ms entre teclas. */
export function BusquedaUrl({ param = "q", placeholder = "Buscar…", className }: { param?: string; placeholder?: string; className?: string }) {
  const { valor, cambiar } = useParametroUrl();
  const [texto, setTexto] = useState(valor(param));
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const t = setTimeout(() => cambiar(param, texto.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={texto}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setTexto(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}

const TODOS = "__todos__";

/** Selector cuyo valor se guarda en la URL. */
export function SelectUrl({
  param,
  etiqueta,
  opciones,
  textoTodos = "Todos",
  className,
}: {
  param: string;
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  textoTodos?: string;
  className?: string;
}) {
  const { valor, cambiar } = useParametroUrl();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
      <Select value={valor(param) || TODOS} onValueChange={(v) => cambiar(param, v === TODOS ? null : v)}>
        <SelectTrigger className="w-full sm:w-48" aria-label={etiqueta}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{textoTodos}</SelectItem>
          {opciones.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.texto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Casilla booleana en la URL (?param=true). */
export function CheckUrl({ param, etiqueta, valorActivo = "true" }: { param: string; etiqueta: string; valorActivo?: string }) {
  const { valor, cambiar } = useParametroUrl();
  const id = `filtro-${param}`;
  return (
    <div className="flex h-9 items-center gap-2">
      <Checkbox
        id={id}
        checked={valor(param) === valorActivo}
        onCheckedChange={(c) => cambiar(param, c === true ? valorActivo : null)}
      />
      <Label htmlFor={id} className="text-sm font-normal">
        {etiqueta}
      </Label>
    </div>
  );
}

/** Fecha (AAAA-MM-DD) en la URL, para filtros desde/hasta. */
export function FechaUrl({ param, etiqueta }: { param: string; etiqueta: string }) {
  const { valor, cambiar } = useParametroUrl();
  const id = `filtro-${param}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {etiqueta}
      </Label>
      <Input id={id} type="date" className="w-full sm:w-40" value={valor(param)} onChange={(e) => cambiar(param, e.target.value)} />
    </div>
  );
}
