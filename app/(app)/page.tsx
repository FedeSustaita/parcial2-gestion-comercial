import { AlertTriangle, Plus, Receipt, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { EstadoVacio } from "@/components/comunes/estados";
import { GraficoFormasDePago, GraficoVentasDiarias } from "@/components/domain/tablero/graficos";
import { PageHeader } from "@/components/layout/page-header";
import { Grid, Inline, Num, Stack, Text, TextoEnLinea, Title } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { formatearMoneda } from "@/lib/format";
import { listarProductos } from "@/services/productos";
import { obtenerTablero } from "@/services/tablero";

// Inicio: tablero con indicadores y gráficos (RF-T1 a RF-T3).
export default async function InicioPage() {
  const usuario = await requerirUsuario();
  const [t, reponer] = await Promise.all([
    obtenerTablero(usuario),
    listarProductos(usuario, { bajoMinimo: "true", pageSize: "5" }),
  ]);

  const indicador = (titulo: string, valor: React.ReactNode, detalle: React.ReactNode, Icono: typeof Receipt, href?: string) => {
    const tarjeta = (
      <Card className="h-full py-4 transition-colors hover:border-primary/40">
        <CardContent className="px-4">
          <Stack gap={2}>
            <Inline justify="between" wrap={false}>
              <Text variant="muted">{titulo}</Text>
              <Icono className="size-4 text-muted-foreground" />
            </Inline>
            <Title level={1} className="text-xl whitespace-nowrap xl:text-2xl">
              <Num>{valor}</Num>
            </Title>
            <Text variant="small">{detalle}</Text>
          </Stack>
        </CardContent>
      </Card>
    );
    return href ? <Link href={href}>{tarjeta}</Link> : tarjeta;
  };

  return (
    <>
      <PageHeader
        title={`Hola, ${usuario.nombre.split(" ")[0]}`}
        description="Resumen del comercio"
        actions={
          <Button asChild>
            <Link href="/ventas/nueva">
              <Plus /> Nueva venta
            </Link>
          </Button>
        }
      />

      {/* RF-T1: indicadores */}
      <Grid cols={4}>
        {indicador("Ventas de hoy", formatearMoneda(t.hoy.importe), `${t.hoy.cantidad} factura${t.hoy.cantidad === 1 ? "" : "s"}`, ShoppingCart, "/ventas")}
        {indicador(
          "Ventas del mes",
          formatearMoneda(t.mes.importe),
          `${t.mes.cantidad} facturas · ticket promedio ${formatearMoneda(t.mes.ticketPromedio)}`,
          Receipt,
          "/ventas",
        )}
        {indicador(
          "Adeudado en cuentas corrientes",
          formatearMoneda(t.cuentasCorrientes.totalAdeudado),
          `${t.cuentasCorrientes.clientesConSaldo} cliente${t.cuentasCorrientes.clientesConSaldo === 1 ? "" : "s"} con saldo`,
          Wallet,
          "/clientes/saldos",
        )}
        {indicador(
          "Productos bajo el mínimo",
          t.bajoMinimo.cantidad,
          "para reponer",
          AlertTriangle,
          "/productos?bajoMinimo=true",
        )}
      </Grid>

      {/* RF-T2: gráficos */}
      <Grid cols={3}>
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle>Ventas de los últimos 30 días</CardTitle>
            <CardDescription>Importe facturado por día (sin anuladas)</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoVentasDiarias datos={t.ventasDiarias} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ventas del mes por forma de pago</CardTitle>
            <CardDescription>Importe total: {formatearMoneda(t.mes.importe)}</CardDescription>
          </CardHeader>
          <CardContent>
            {t.mes.importe === 0 ? <EstadoVacio titulo="Sin ventas este mes" /> : <GraficoFormasDePago datos={t.porFormaDePago} />}
          </CardContent>
        </Card>
      </Grid>

      <Grid cols={2} className="items-start sm:grid-cols-1 xl:grid-cols-2">
        {/* RF-T3: los 5 más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Los 5 más vendidos del mes</CardTitle>
            <CardDescription>Por unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {t.masVendidos.length === 0 ? (
              <EstadoVacio titulo="Todavía no hay ventas este mes" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {t.masVendidos.map((m, i) => (
                    <TableRow key={m.productoId}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Link href={`/productos/${m.productoId}`} className="hover:underline">
                          <TextoEnLinea variant="strong">{m.codigo}</TextoEnLinea> {m.descripcion}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right"><Num>{m.unidades}</Num></TableCell>
                      <TableCell className="text-right whitespace-nowrap"><Num>{formatearMoneda(m.importe)}</Num></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Productos para reponer: sale de GET /api/productos?bajoMinimo=true (11.7) */}
        <Card>
          <CardHeader>
            <CardTitle>Para reponer</CardTitle>
            <CardDescription>
              <Link href="/productos?bajoMinimo=true" className="hover:underline">
                Ver todos los productos bajo el mínimo ({reponer.total})
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reponer.data.length === 0 ? (
              <EstadoVacio titulo="Todo el stock está por encima del mínimo" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Existencia</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reponer.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/productos/${p.id}`} className="hover:underline">
                          <TextoEnLinea variant="strong">{p.codigo}</TextoEnLinea> {p.descripcion}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Num className="font-semibold text-amber-700">{p.existencia}</Num>
                      </TableCell>
                      <TableCell className="text-right"><Num>{p.stockMinimo}</Num></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
}
