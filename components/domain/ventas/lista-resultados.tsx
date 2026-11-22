"use client";

import { cn } from "@/lib/utils";

/** Lista desplegable de resultados navegable con flechas (la maneja el input dueño). */
export function ListaResultados<T>({
  items,
  activo,
  onElegir,
  render,
  vacio,
  cargando,
}: {
  items: T[];
  activo: number;
  onElegir: (item: T) => void;
  render: (item: T) => React.ReactNode;
  vacio?: string;
  cargando?: boolean;
}) {
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg" role="listbox">
      {cargando && items.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>}
      {!cargando && items.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">{vacio ?? "Sin resultados"}</div>}
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          role="option"
          tabIndex={-1} // Tab pasa directo al campo de cantidad
          aria-selected={i === activo}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onElegir(item)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm",
            i === activo ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          )}
        >
          {render(item)}
        </button>
      ))}
    </div>
  );
}

/** Manejo de flechas/Enter/Escape para un input con lista de resultados. */
export function teclasLista(
  e: React.KeyboardEvent,
  total: number,
  activo: number,
  setActivo: (n: number) => void,
  onEnter: () => void,
  onEscape: () => void,
) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActivo(Math.min(total - 1, activo + 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActivo(Math.max(0, activo - 1));
  } else if (e.key === "Enter") {
    e.preventDefault();
    onEnter();
  } else if (e.key === "Escape") {
    onEscape();
  }
}
