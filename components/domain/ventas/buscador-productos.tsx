"use client";

import { forwardRef, useState } from "react";
import { InsigniaBajoMinimo } from "@/components/comunes/insignias";
import { Input } from "@/components/ui/input";
import { useBusqueda } from "@/hooks/use-busqueda";
import { formatearMoneda } from "@/lib/format";
import type { ProductoPublico } from "@/services/productos";
import { ListaResultados, teclasLista } from "./lista-resultados";

/**
 * RF-V3: búsqueda de producto por código o descripción. Se opera con teclado:
 * escribir, ↑/↓ para elegir, Enter para agregar. La cantidad sale del campo
 * de al lado (por defecto 1).
 */
export const BuscadorProductos = forwardRef<
  HTMLInputElement,
  { onAgregar: (p: ProductoPublico, cantidad: number) => void }
>(function BuscadorProductos({ onAgregar }, ref) {
  const [texto, setTexto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [abierta, setAbierta] = useState(false);
  const [activo, setActivo] = useState(0);
  const q = texto.trim();
  const { resultados, cargando } = useBusqueda<ProductoPublico>(
    q.length >= 1 ? `/api/productos?pageSize=8&q=${encodeURIComponent(q)}` : null,
  );

  function agregar(p: ProductoPublico | undefined) {
    if (!p) return;
    onAgregar(p, Math.max(1, Math.trunc(Number(cantidad)) || 1));
    setTexto("");
    setCantidad("1");
    setAbierta(false);
    setActivo(0);
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={ref}
          value={texto}
          placeholder="Código o descripción del producto (F2)"
          aria-label="Buscar producto"
          autoFocus
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierta(true);
            setActivo(0);
          }}
          onFocus={() => setAbierta(true)}
          onBlur={() => setAbierta(false)}
          onKeyDown={(e) => {
            // Un código exacto se agrega aunque la lista todavía no haya cargado.
            const exacto = resultados.find((p) => p.codigo === q.toUpperCase());
            teclasLista(e, resultados.length, activo, setActivo, () => agregar(exacto ?? resultados[activo]), () => setAbierta(false));
          }}
        />
        {abierta && q.length >= 1 && (
          <ListaResultados
            items={resultados}
            activo={activo}
            cargando={cargando}
            onElegir={agregar}
            vacio="No hay productos activos con ese código o descripción."
            render={(p) => (
              <div className="flex w-full flex-col gap-0.5">
                <span className="truncate">
                  <span className="font-medium">{p.codigo}</span> · {p.descripcion}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.bajoMinimo && <InsigniaBajoMinimo />}
                  <span className={p.existencia === 0 ? "text-destructive" : ""}>Stock {p.existencia}</span>
                  <span className="ml-auto font-medium text-foreground tabular-nums">{formatearMoneda(p.precio)}</span>
                </span>
              </div>
            )}
          />
        )}
      </div>
      <Input
        type="number"
        min={1}
        step={1}
        value={cantidad}
        aria-label="Cantidad a agregar"
        className="w-20 text-right"
        onChange={(e) => setCantidad(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            agregar(resultados[activo]);
          }
        }}
      />
    </div>
  );
});
