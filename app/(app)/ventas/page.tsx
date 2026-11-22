import { Plus } from "lucide-react";
import Link from "next/link";
import { EstadoVacio } from "@/components/comunes/estados";
import { BarraFiltros, BusquedaUrl, FechaUrl, SelectUrl } from "@/components/comunes/filtros";
import { InsigniaEstadoFactura } from "@/components/comunes/insignias";
import { Paginador } from "@/components/comunes/paginador";
import { MarcoTabla } from "@/components/comunes/tabla";
import { PageHeader } from "@/components/layout/page-header";
import { Inline, Num, Stack, Text, TextoEnLinea } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { ETIQUETAS, formatearFechaHora, formatearMoneda } from "@/lib/format";
import { aQuery } from "@/lib/paginas";
import { listarClientes } from "@/services/clientes";
import { listarFacturas } from "@/services/facturas";
import { listarVendedores } from "@/services/usuarios";

// RF-V8: facturas con filtros por fechas, cliente, forma de pago y vendedor;
// búsqueda por número; paginado. Los filtros viven en la URL.
export default async function VentasPage({ searchParams }: PageProps<"/ventas">) {
  const usuario = await requerirUsuario();
  const query = aQuery(await searchParams);
  const [res, clientes, vendedores] = await Promise.all([
    listarFacturas(usuario, query),
    listarClientes(usuario, { pageSize: "100", activo: "todos" }),
    listarVendedores(usuario),
  ]);
  const hayFiltros = Object.keys(query).some((k) => k !== "page");

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Facturas emitidas y anuladas"
        actions={
          <Button asChild>
            <Link href="/ventas/nueva">
              <Plus /> Nueva venta
            </Link>
          </Button>
        }
      />
      <Stack gap={4}>
        <BarraFiltros>
          <BusquedaUrl placeholder="Número o cliente" />
          <FechaUrl param="desde" etiqueta="Desde" />
          <FechaUrl param="hasta" etiqueta="Hasta" />
          <SelectUrl
            param="clienteId"
            etiqueta="Cliente"
            opciones={clientes.data.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
          />
          <SelectUrl
            param="forma"
            etiqueta="Forma de pago"
            textoTodos="Todas"
            opciones={Object.entries(ETIQUETAS.formaPago).map(([valor, texto]) => ({ valor, texto }))}
          />
          <SelectUrl param="vendedorId" etiqueta="Vendedor" opciones={vendedores.map((v) => ({ valor: String(v.id), texto: v.nombre }))} />
          <SelectUrl
            param="estado"
            etiqueta="Estado"
            opciones={Object.entries(ETIQUETAS.estadoFactura).map(([valor, texto]) => ({ valor, texto }))}
          />
        </BarraFiltros>

        {res.data.length === 0 ? (
          <EstadoVacio
            titulo={hayFiltros ? "Ninguna factura coincide con los filtros" : "Todavía no hay facturas"}
            accion={
              !hayFiltros && (
                <Button asChild>
                  <Link href="/ventas/nueva">Hacer la primera venta</Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <MarcoTabla>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Forma de pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {res.data.map((f) => (
                    <TableRow key={f.id} className={f.estado === "anulada" ? "text-muted-foreground" : ""}>
                      <TableCell className="font-medium">
                        <Link href={`/ventas/${f.id}`} className="tabular-nums hover:underline">
                          {f.numeroFormateado}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatearFechaHora(f.fecha)}</TableCell>
                      <TableCell>
                        {f.cliente ? (
                          <Link href={`/clientes/${f.cliente.id}`} className="hover:underline">
                            {f.cliente.nombre}
                          </Link>
                        ) : (
                          <TextoEnLinea variant="muted">Consumidor final</TextoEnLinea>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{f.vendedor.nombre}</TableCell>
                      <TableCell>{ETIQUETAS.formaPago[f.formaPago]}</TableCell>
                      <TableCell className={f.estado === "anulada" ? "text-right whitespace-nowrap line-through" : "text-right whitespace-nowrap"}>
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
            <Inline justify="end">
              <Text variant="muted">
                Total emitido (sin anuladas): <Num className="font-semibold text-foreground">{formatearMoneda(res.totalEmitido)}</Num>
              </Text>
            </Inline>
          </>
        )}
        <Paginador page={res.page} pageSize={res.pageSize} total={res.total} />
      </Stack>
    </>
  );
}
