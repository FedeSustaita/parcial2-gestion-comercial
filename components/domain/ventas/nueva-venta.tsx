"use client";

import { Keyboard, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearMoneda } from "@/lib/format";
import { cn } from "@/lib/utils";
import { crearFacturaSchema, MAX_UNIDADES_POR_RENGLON } from "@/schemas/facturas";
import type { ClientePublico } from "@/services/clientes";
import type { ProductoPublico } from "@/services/productos";
import { BuscadorProductos } from "./buscador-productos";
import { PanelPago, type EstadoPago } from "./panel-pago";
import { SelectorComprador } from "./selector-comprador";

type Renglon = { producto: ProductoPublico; cantidad: number };

const PAGO_INICIAL: EstadoPago = {
  forma: "contado",
  montoRecibido: null,
  tarjeta: { tipo: "debito", marca: "", ultimos4: "" },
};

/**
 * RF-V1: Nueva venta en UNA pantalla con tres partes: comprador, ítems y
 * forma de pago. El total se recalcula en cada cambio (solo para mostrar: el
 * servidor vuelve a calcular todo con los precios del catálogo).
 * Teclado: F2 buscar producto · Enter agregar · F4 ir al pago · Ctrl+Enter confirmar.
 */
export function NuevaVenta({ proximoNumero }: { proximoNumero: string }) {
  const router = useRouter();
  const [comprador, setComprador] = useState<ClientePublico | null>(null);
  const [renglones, setRenglones] = useState<Renglon[]>([]);
  const [pago, setPago] = useState<EstadoPago>(PAGO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const buscadorRef = useRef<HTMLInputElement>(null);
  const pagoRef = useRef<HTMLButtonElement>(null);

  const total = renglones.reduce((s, r) => s + r.producto.precio * r.cantidad, 0);
  const excedidos = renglones.filter((r) => r.cantidad > r.producto.existencia);

  // Si el nuevo comprador no tiene cuenta corriente, volvemos a contado.
  function cambiarComprador(c: ClientePublico | null) {
    setComprador(c);
    if (!c?.cuentaCorriente) setPago((p) => (p.forma === "cuenta_corriente" ? { ...p, forma: "contado" } : p));
  }

  // RF-V3 / RF-V4: agregar suma al renglón existente y no supera la existencia.
  function agregar(p: ProductoPublico, cantidad: number) {
    setErrores({});
    setRenglones((rs) => {
      const i = rs.findIndex((r) => r.producto.id === p.id);
      const actual = i >= 0 ? rs[i].cantidad : 0;
      const nueva = Math.min(actual + cantidad, p.existencia);
      if (p.existencia === 0) {
        toast.error(`${p.codigo} no tiene existencia disponible.`);
        return rs;
      }
      if (actual + cantidad > p.existencia) toast.warning(`${p.codigo}: solo hay ${p.existencia} disponibles.`);
      if (i >= 0) return rs.map((r, j) => (j === i ? { producto: p, cantidad: nueva } : r));
      return [...rs, { producto: p, cantidad: nueva }];
    });
    buscadorRef.current?.focus();
  }

  function cambiarCantidad(id: number, cantidad: number) {
    setRenglones((rs) =>
      rs.map((r) => (r.producto.id === id ? { ...r, cantidad: Math.max(1, Math.min(cantidad || 1, MAX_UNIDADES_POR_RENGLON)) } : r)),
    );
  }

  function cuerpo() {
    return {
      clienteId: comprador?.id ?? null,
      items: renglones.map((r) => ({ productoId: r.producto.id, cantidad: r.cantidad })),
      pago:
        pago.forma === "contado"
          ? { forma: "contado" as const, ...(pago.montoRecibido != null ? { montoRecibido: pago.montoRecibido } : {}) }
          : pago.forma === "tarjeta"
            ? { forma: "tarjeta" as const, tarjeta: pago.tarjeta }
            : { forma: "cuenta_corriente" as const },
    };
  }

  // RF-V6: confirmar. La pantalla consume la API REST (POST /api/facturas).
  async function confirmar() {
    if (enviando) return;
    const datos = cuerpo();
    // Mismo esquema Zod que usa el servidor (adelanta los errores).
    const v = crearFacturaSchema.safeParse(datos);
    const errs: Record<string, string> = {};
    if (!v.success) for (const i of v.error.issues) errs[i.path.join(".")] ??= i.message;
    if (pago.forma === "contado" && pago.montoRecibido != null && pago.montoRecibido < total) errs.montoRecibido = "No cubre el total.";
    if (excedidos.length) errs.items = "Hay renglones que superan la existencia disponible.";
    setErrores(errs);
    if (Object.keys(errs).length) {
      toast.error(errs.items ?? Object.values(errs)[0]);
      return;
    }

    setEnviando(true);
    try {
      const r = await fetch("/api/facturas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await r.json();
      if (!r.ok) {
        manejarError(json.error);
        return;
      }
      toast.success(`Factura ${json.numeroFormateado} emitida.`);
      router.push(`/ventas/${json.id}`);
      router.refresh();
    } catch {
      toast.error("No se pudo confirmar la venta. Revisá tu conexión.");
    } finally {
      setEnviando(false);
    }
  }

  function manejarError(error: { code: string; message: string; details?: unknown }) {
    toast.error(error.message);
    if (error.code === "STOCK_INSUFICIENTE" && Array.isArray(error.details)) {
      // Actualiza la existencia que informó el servidor (otra venta pudo llevársela).
      const disp = new Map((error.details as { productoId: number; disponible: number }[]).map((d) => [d.productoId, d.disponible]));
      setRenglones((rs) => rs.map((r) => (disp.has(r.producto.id) ? { ...r, producto: { ...r.producto, existencia: disp.get(r.producto.id)! } } : r)));
      setErrores({ items: "Algunos productos ya no tienen la existencia pedida." });
    } else if (error.code === "MONTO_INSUFICIENTE") {
      setErrores({ montoRecibido: "No cubre el total." });
    } else if (Array.isArray(error.details)) {
      const e: Record<string, string> = {};
      for (const d of error.details as { campo?: string; mensaje?: string }[]) if (d.campo && d.mensaje) e[d.campo] = d.mensaje;
      setErrores(e);
    }
  }

  // Atajos de teclado de la pantalla (sección 8: "Venta ágil").
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        buscadorRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        pagoRef.current?.focus();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        confirmar();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1 · Comprador</CardTitle>
          </CardHeader>
          <CardContent>
            <SelectorComprador comprador={comprador} onCambiar={cambiarComprador} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2 · Productos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <BuscadorProductos ref={buscadorRef} onAgregar={agregar} />
            {errores.items && <p className="text-sm text-destructive" role="alert">{errores.items}</p>}
            {renglones.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                <ShoppingCart className="size-6" />
                Buscá un producto y presioná Enter para agregarlo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">P. unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renglones.map((r) => {
                      const excede = r.cantidad > r.producto.existencia;
                      return (
                        <TableRow key={r.producto.id}>
                          <TableCell className="min-w-48">
                            <div className="font-medium">{r.producto.descripcion}</div>
                            <div className={cn("text-xs", excede ? "font-medium text-destructive" : "text-muted-foreground")}>
                              {r.producto.codigo} · Disponible {r.producto.existencia}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button type="button" variant="outline" size="icon-sm" aria-label="Restar uno" onClick={() => cambiarCantidad(r.producto.id, r.cantidad - 1)}>
                                <Minus />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                max={r.producto.existencia}
                                value={r.cantidad}
                                aria-label={`Cantidad de ${r.producto.descripcion}`}
                                aria-invalid={excede || undefined}
                                onChange={(e) => cambiarCantidad(r.producto.id, Math.min(Number(e.target.value), r.producto.existencia))}
                                className="h-8 w-16 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label="Sumar uno"
                                disabled={r.cantidad >= r.producto.existencia}
                                onClick={() => cambiarCantidad(r.producto.id, r.cantidad + 1)}
                              >
                                <Plus />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap tabular-nums">{formatearMoneda(r.producto.precio)}</TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                            {formatearMoneda(r.producto.precio * r.cantidad)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Quitar ${r.producto.descripcion}`}
                              onClick={() => setRenglones((rs) => rs.filter((x) => x.producto.id !== r.producto.id))}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-20 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>3 · Forma de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <PanelPago pago={pago} onCambiar={setPago} total={total} comprador={comprador} errores={errores} primerCampoRef={pagoRef} />
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {renglones.length} renglón{renglones.length === 1 ? "" : "es"} · {renglones.reduce((s, r) => s + r.cantidad, 0)} u.
              </span>
              <span className="text-xs text-muted-foreground">Próx. N° {proximoNumero}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-medium">Total</span>
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatearMoneda(total)}</span>
            </div>
            <Button size="lg" onClick={confirmar} disabled={enviando || renglones.length === 0}>
              {enviando ? "Confirmando…" : "Confirmar venta"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Keyboard className="size-3.5" /> F2 buscar · Enter agregar · F4 pago · Ctrl+Enter confirmar
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
