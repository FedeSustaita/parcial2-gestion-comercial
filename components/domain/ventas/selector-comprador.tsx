"use client";

import { UserPlus, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Insignia } from "@/components/comunes/insignias";
import { DialogoCliente } from "@/components/domain/clientes/dialogo-cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusqueda } from "@/hooks/use-busqueda";
import { formatearMoneda } from "@/lib/format";
import type { ClientePublico } from "@/services/clientes";
import { ListaResultados, teclasLista } from "./lista-resultados";

/**
 * RF-V2: comprador. Por defecto Consumidor final. Se puede buscar un cliente
 * por nombre o documento, o darlo de alta en un modal sin perder la venta.
 */
export function SelectorComprador({
  comprador,
  onCambiar,
}: {
  comprador: ClientePublico | null;
  onCambiar: (c: ClientePublico | null) => void;
}) {
  const [texto, setTexto] = useState("");
  const [abierta, setAbierta] = useState(false);
  const [activo, setActivo] = useState(0);
  const [alta, setAlta] = useState(false);
  const [claveAlta, setClaveAlta] = useState(0); // formulario nuevo en cada alta
  const { resultados, cargando } = useBusqueda<ClientePublico>(
    texto.trim().length >= 2 ? `/api/clientes?pageSize=6&q=${encodeURIComponent(texto.trim())}` : null,
  );

  function elegir(c: ClientePublico) {
    onCambiar(c);
    setTexto("");
    setAbierta(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {comprador ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium">{comprador.nombre}</span>
            <span className="text-xs text-muted-foreground">
              {comprador.tipoDoc} {comprador.nroDoc}
            </span>
            {comprador.cuentaCorriente ? (
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Insignia tono="azul">Cuenta corriente</Insignia>
                Saldo {formatearMoneda(comprador.saldo)} · Disponible{" "}
                {comprador.disponible == null ? "sin límite" : formatearMoneda(comprador.disponible)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Sin cuenta corriente</span>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => onCambiar(null)} aria-label="Volver a consumidor final">
            <X />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
          <UserRound className="size-4 text-muted-foreground" />
          <span className="font-medium">Consumidor final</span>
          <span className="text-muted-foreground">· no requiere datos</span>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={texto}
            placeholder="Buscar cliente por nombre o documento…"
            aria-label="Buscar cliente"
            onChange={(e) => {
              setTexto(e.target.value);
              setAbierta(true);
              setActivo(0);
            }}
            onFocus={() => setAbierta(true)}
            onBlur={() => setAbierta(false)}
            onKeyDown={(e) =>
              teclasLista(e, resultados.length, activo, setActivo, () => resultados[activo] && elegir(resultados[activo]), () => setAbierta(false))
            }
          />
          {abierta && texto.trim().length >= 2 && (
            <ListaResultados
              items={resultados}
              activo={activo}
              cargando={cargando}
              onElegir={elegir}
              vacio="No hay clientes con ese nombre o documento."
              render={(c) => (
                <>
                  <span className="truncate">
                    {c.nombre} <span className="text-muted-foreground">· {c.tipoDoc} {c.nroDoc}</span>
                  </span>
                  {c.cuentaCorriente && <Insignia tono="azul">CC</Insignia>}
                </>
              )}
            />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setClaveAlta((k) => k + 1);
            setAlta(true);
          }}
        >
          <UserPlus /> Nuevo
        </Button>
      </div>
      <DialogoCliente key={claveAlta} abierto={alta} onAbiertoChange={setAlta} onGuardado={(c) => onCambiar(c)} />
    </div>
  );
}
