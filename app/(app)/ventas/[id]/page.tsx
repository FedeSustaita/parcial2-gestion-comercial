import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { BotonImprimir } from "@/components/comunes/imprimir";
import { InsigniaEstadoFactura } from "@/components/comunes/insignias";
import { BotonAnular } from "@/components/domain/ventas/boton-anular";
import { EncabezadoComprobante } from "@/components/domain/encabezado-comprobante";
import { Grid, Inline, Num, Stack, Text, Title } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { COMERCIO } from "@/lib/comercio";
import { ETIQUETAS, formatearFechaHora, formatearMoneda } from "@/lib/format";
import { o404 } from "@/lib/paginas";
import { obtenerFactura } from "@/services/facturas";

// RF-V7: comprobante imprimible. RF-V9: anulación (solo admin).
export default async function FacturaPage({ params }: PageProps<"/ventas/[id]">) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const f = await o404(obtenerFactura(usuario, id));

  return (
    <>
      <Inline justify="between" className="print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ventas">
            <ArrowLeft /> Facturas
          </Link>
        </Button>
        <Inline gap={2}>
          {usuario.rol === "admin" && f.estado === "emitida" && <BotonAnular facturaId={f.id} numero={f.numeroFormateado} />}
          <Button variant="outline" asChild>
            <Link href="/ventas/nueva">
              <Plus /> Nueva venta
            </Link>
          </Button>
          <BotonImprimir />
        </Inline>
      </Inline>

      {f.anulacion && (
        <Card className="border-destructive/40 bg-destructive/5 py-4">
          <CardContent className="px-4">
            <Stack gap={1}>
              <Inline gap={2}>
                <InsigniaEstadoFactura estado="anulada" />
                <Text variant="strong">
                  Anulada el {formatearFechaHora(f.anulacion.fecha)} por {f.anulacion.usuario.nombre}
                </Text>
              </Inline>
              <Text variant="muted">Motivo: {f.anulacion.motivo}</Text>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card className="mx-auto w-full max-w-3xl print:border-0 print:shadow-none">
        <CardContent>
          <Stack gap={6}>
            <EncabezadoComprobante tipo={f.estado === "anulada" ? "Factura · ANULADA" : "Factura"} numero={f.numeroFormateado} fecha={f.fecha} />
            <Grid cols={2}>
              <Stack gap={1}>
                <Text variant="small">Comprador</Text>
                {f.cliente ? (
                  <>
                    <Title level={3}>{f.cliente.nombre}</Title>
                    <Text variant="muted">
                      {f.cliente.tipoDoc} {f.cliente.nroDoc}
                      {f.cliente.domicilio && ` · ${f.cliente.domicilio}`}
                    </Text>
                  </>
                ) : (
                  <Title level={3}>Consumidor final</Title>
                )}
              </Stack>
              <Stack gap={1} className="sm:text-right">
                <Text variant="small">Vendedor</Text>
                <Text variant="strong">{f.vendedor.nombre}</Text>
              </Stack>
            </Grid>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">P. unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {f.items.map((i) => (
                  <TableRow key={i.productoId}>
                    <TableCell className="text-muted-foreground">{i.codigo}</TableCell>
                    <TableCell>{i.descripcion}</TableCell>
                    <TableCell className="text-right"><Num>{i.cantidad}</Num></TableCell>
                    <TableCell className="text-right whitespace-nowrap"><Num>{formatearMoneda(i.precioUnitario)}</Num></TableCell>
                    <TableCell className="text-right whitespace-nowrap"><Num>{formatearMoneda(i.subtotal)}</Num></TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right text-base font-semibold">Total</TableCell>
                  <TableCell className="text-right text-base font-semibold whitespace-nowrap">
                    <Num>{formatearMoneda(f.total)}</Num>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            <Stack gap={1} className="rounded-lg bg-muted/50 p-4">
              <Text variant="small">Forma de pago</Text>
              <Text variant="strong">{ETIQUETAS.formaPago[f.pago.forma]}</Text>
              {f.pago.forma === "contado" && (
                <Text variant="muted">
                  Recibido {formatearMoneda(f.pago.montoRecibido)} · Vuelto {formatearMoneda(f.pago.vuelto)}
                </Text>
              )}
              {f.pago.forma === "tarjeta" && (
                <Text variant="muted">
                  {ETIQUETAS.tipoTarjeta[f.pago.tarjeta.tipo]} {f.pago.tarjeta.marca} terminada en {f.pago.tarjeta.ultimos4}
                </Text>
              )}
              {f.pago.forma === "cuenta_corriente" && f.saldoCliente != null && (
                <Text variant="muted">Saldo de la cuenta después de esta venta: {formatearMoneda(f.saldoCliente)}</Text>
              )}
            </Stack>
            <Text variant="small" className="text-center">{COMERCIO.leyenda} · Precios finales con impuestos incluidos</Text>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
