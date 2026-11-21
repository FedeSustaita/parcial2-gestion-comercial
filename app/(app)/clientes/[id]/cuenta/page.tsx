import Link from "next/link";
import { EstadoVacio } from "@/components/comunes/estados";
import { BarraFiltros, FechaUrl } from "@/components/comunes/filtros";
import { Insignia } from "@/components/comunes/insignias";
import { MarcoTabla } from "@/components/comunes/tabla";
import { Num, Stack } from "@/components/layout/primitivas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { formatearFecha, formatearFechaHora, formatearMoneda } from "@/lib/format";
import { aQuery, o404 } from "@/lib/paginas";
import { cuentaCliente } from "@/services/clientes";

// RF-C4: movimientos en orden cronológico con el saldo acumulado en cada renglón.
export default async function CuentaPage({ params, searchParams }: PageProps<"/clientes/[id]/cuenta">) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const query = aQuery(await searchParams);
  const cuenta = await o404(cuentaCliente(usuario, id, query));

  return (
    <Stack gap={4}>
      <BarraFiltros>
        <FechaUrl param="desde" etiqueta="Desde" />
        <FechaUrl param="hasta" etiqueta="Hasta" />
      </BarraFiltros>
      {cuenta.movimientos.length === 0 && !query.desde ? (
        <EstadoVacio titulo="Sin movimientos" descripcion="Las ventas a cuenta y los pagos aparecen acá." />
      ) : (
        <MarcoTabla>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Débito</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.desde && (
                <TableRow className="bg-muted/40">
                  <TableCell>{formatearFecha(`${query.desde}T12:00:00Z`)}</TableCell>
                  <TableCell className="text-muted-foreground">Saldo anterior</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-medium">
                    <Num>{formatearMoneda(cuenta.saldoAnterior)}</Num>
                  </TableCell>
                </TableRow>
              )}
              {cuenta.movimientos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap">{formatearFechaHora(m.fecha)}</TableCell>
                  <TableCell>
                    {m.facturaId ? (
                      <Link href={`/ventas/${m.facturaId}`} className="hover:underline">
                        {m.descripcion}
                      </Link>
                    ) : m.pagoId ? (
                      <Link href={`/clientes/recibos/${m.pagoId}`} className="hover:underline">
                        {m.descripcion}
                      </Link>
                    ) : (
                      m.descripcion
                    )}{" "}
                    {m.tipo === "credito" && m.facturaId && <Insignia tono="rojo">Anulación</Insignia>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {m.tipo === "debito" && <Num>{formatearMoneda(m.importe)}</Num>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-emerald-700">
                    {m.tipo === "credito" && <Num>{formatearMoneda(m.importe)}</Num>}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    <Num>{formatearMoneda(m.saldo)}</Num>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MarcoTabla>
      )}
    </Stack>
  );
}
