"use client";

import { Banknote, CreditCard, NotebookPen } from "lucide-react";
import { CampoImporte } from "@/components/comunes/campo-importe";
import { Campo } from "@/components/comunes/campo";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatearMoneda } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientePublico } from "@/services/clientes";

export type EstadoPago = {
  forma: "contado" | "tarjeta" | "cuenta_corriente";
  montoRecibido: number | null;
  tarjeta: { tipo: "debito" | "credito"; marca: string; ultimos4: string };
};

const MARCAS = ["Visa", "Mastercard", "American Express", "Cabal", "Naranja", "Maestro"];

/** RF-V5: una forma de pago por factura. */
export function PanelPago({
  pago,
  onCambiar,
  total,
  comprador,
  errores,
  primerCampoRef,
}: {
  pago: EstadoPago;
  onCambiar: (p: EstadoPago) => void;
  total: number;
  comprador: ClientePublico | null;
  errores: Record<string, string>;
  primerCampoRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const ccHabilitada = !!comprador?.cuentaCorriente;
  const vuelto = pago.montoRecibido != null ? pago.montoRecibido - total : 0;
  const saldoNuevo = (comprador?.saldo ?? 0) + total;
  const superaLimite = comprador?.limiteCredito != null && saldoNuevo > comprador.limiteCredito;

  const opcion = (forma: EstadoPago["forma"], etiqueta: string, Icono: typeof Banknote, deshabilitada = false) => (
    <button
      type="button"
      ref={forma === "contado" ? primerCampoRef : undefined}
      disabled={deshabilitada}
      aria-pressed={pago.forma === forma}
      onClick={() => onCambiar({ ...pago, forma })}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
        pago.forma === forma ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
      )}
    >
      <Icono className="size-5" />
      {etiqueta}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {opcion("contado", "Contado", Banknote)}
        {opcion("tarjeta", "Tarjeta", CreditCard)}
        {opcion("cuenta_corriente", "Cta. corriente", NotebookPen, !ccHabilitada)}
      </div>
      {!ccHabilitada && (
        <p className="text-xs text-muted-foreground">
          Cuenta corriente: solo para clientes registrados y habilitados (regla 6).
        </p>
      )}

      {pago.forma === "contado" && (
        <div className="grid grid-cols-2 items-end gap-3">
          <Campo id="montoRecibido" etiqueta="Monto recibido" error={errores["pago.montoRecibido"] ?? errores.montoRecibido}>
            <CampoImporte
              id="montoRecibido"
              valor={pago.montoRecibido}
              placeholder={formatearMoneda(total).replace("$ ", "")}
              invalido={!!(errores["pago.montoRecibido"] ?? errores.montoRecibido)}
              onCambio={(c) => onCambiar({ ...pago, montoRecibido: c })}
            />
          </Campo>
          <div className="flex flex-col gap-1.5 pb-1">
            <span className="text-sm text-muted-foreground">Vuelto</span>
            <span className={cn("text-xl font-semibold tabular-nums", vuelto < 0 && "text-destructive")}>
              {pago.montoRecibido == null ? formatearMoneda(0) : formatearMoneda(vuelto)}
            </span>
          </div>
        </div>
      )}

      {pago.forma === "tarjeta" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo id="tarjeta-tipo" etiqueta="Tipo" error={errores["pago.tarjeta.tipo"]}>
            <Select value={pago.tarjeta.tipo} onValueChange={(t) => onCambiar({ ...pago, tarjeta: { ...pago.tarjeta, tipo: t as "debito" | "credito" } })}>
              <SelectTrigger id="tarjeta-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debito">Débito</SelectItem>
                <SelectItem value="credito">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="tarjeta-marca" etiqueta="Marca" error={errores["pago.tarjeta.marca"]}>
            <Select value={pago.tarjeta.marca} onValueChange={(m) => onCambiar({ ...pago, tarjeta: { ...pago.tarjeta, marca: m } })}>
              <SelectTrigger id="tarjeta-marca" className="w-full" aria-invalid={!!errores["pago.tarjeta.marca"] || undefined}>
                <SelectValue placeholder="Elegí" />
              </SelectTrigger>
              <SelectContent>
                {MARCAS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          {/* Regla 9: nunca se pide el número completo, solo los últimos 4. */}
          <Campo id="tarjeta-ultimos4" etiqueta="Últimos 4 dígitos" error={errores["pago.tarjeta.ultimos4"]}>
            <Input
              id="tarjeta-ultimos4"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="1234"
              value={pago.tarjeta.ultimos4}
              aria-invalid={!!errores["pago.tarjeta.ultimos4"] || undefined}
              onChange={(e) => onCambiar({ ...pago, tarjeta: { ...pago.tarjeta, ultimos4: e.target.value.replace(/\D/g, "").slice(0, 4) } })}
              className="tracking-widest"
            />
          </Campo>
        </div>
      )}

      {pago.forma === "cuenta_corriente" && comprador && (
        <div className={cn("rounded-lg border p-3 text-sm", superaLimite && "border-destructive/50 bg-destructive/5")}>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo actual</span>
            <span className="tabular-nums">{formatearMoneda(comprador.saldo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo después de la venta</span>
            <span className="font-medium tabular-nums">{formatearMoneda(saldoNuevo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Límite</span>
            <span className="tabular-nums">{comprador.limiteCredito == null ? "Sin límite" : formatearMoneda(comprador.limiteCredito)}</span>
          </div>
          {superaLimite && <p className="mt-2 font-medium text-destructive">La venta supera el límite de crédito del cliente.</p>}
        </div>
      )}
    </div>
  );
}
