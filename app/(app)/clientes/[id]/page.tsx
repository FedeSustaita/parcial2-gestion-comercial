import Link from "next/link";
import { EstadoVacio } from "@/components/comunes/estados";
import { InsigniaEstadoFactura } from "@/components/comunes/insignias";
import { MarcoTabla } from "@/components/comunes/tabla";
import { Grid, Num, Stack, Text, Title } from "@/components/layout/primitivas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { ETIQUETAS, formatearFechaHora, formatearMoneda } from "@/lib/format";
import { o404 } from "@/lib/paginas";
import { obtenerCliente } from "@/services/clientes";

// RF-C3: datos del cliente y últimas facturas.
export default async function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const c = await o404(obtenerCliente(usuario, id));

  const fila = (etiqueta: string, valor: string | null) => (
    <Stack gap={0}>
      <Text variant="small">{etiqueta}</Text>
      <Text>{valor || "—"}</Text>
    </Stack>
  );

  return (
    <Grid cols={3} className="items-start">
      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap={3}>
            {fila("Documento", `${c.tipoDoc} ${c.nroDoc}`)}
            {fila("Domicilio", c.domicilio)}
            {fila("Teléfono", c.telefono)}
            {fila("Email", c.email)}
          </Stack>
        </CardContent>
      </Card>
      <Stack gap={3} className="sm:col-span-1 lg:col-span-2">
        <Title level={2}>Últimas facturas</Title>
        {c.ultimasFacturas.length === 0 ? (
          <EstadoVacio titulo="Sin facturas" descripcion="Todavía no le vendimos a este cliente." />
        ) : (
          <MarcoTabla>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Forma de pago</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.ultimasFacturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      <Link href={`/ventas/${f.id}`} className="tabular-nums hover:underline">
                        {f.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatearFechaHora(f.fecha)}</TableCell>
                    <TableCell>{ETIQUETAS.formaPago[f.formaPago]}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Num>{formatearMoneda(f.total)}</Num>
                    </TableCell>
                    <TableCell>
                      <InsigniaEstadoFactura estado={f.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </MarcoTabla>
        )}
      </Stack>
    </Grid>
  );
}
