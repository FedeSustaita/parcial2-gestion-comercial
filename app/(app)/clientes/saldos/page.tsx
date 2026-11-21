import { EstadoVacio } from "@/components/comunes/estados";
import { Paginador } from "@/components/comunes/paginador";
import { PestanasClientes } from "@/components/domain/clientes/pestanas-clientes";
import { TablaClientes } from "@/components/domain/clientes/tabla-clientes";
import { PageHeader } from "@/components/layout/page-header";
import { Inline, Num, Stack, Text, Title } from "@/components/layout/primitivas";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth";
import { formatearMoneda } from "@/lib/format";
import { aQuery } from "@/lib/paginas";
import { listarClientes } from "@/services/clientes";

// RF-C6: clientes con deuda, de mayor a menor, con el total adeudado.
export default async function SaldosPage({ searchParams }: PageProps<"/clientes/saldos">) {
  const usuario = await requerirUsuario();
  const query = aQuery(await searchParams);
  const res = await listarClientes(usuario, { ...query, conDeuda: "true", orden: "saldo" });

  return (
    <>
      <PageHeader title="Clientes" description="Cuentas corrientes, pagos y saldos" />
      <PestanasClientes />
      <Stack gap={4}>
        <Card className="py-4">
          <CardContent className="px-4">
            <Inline justify="between">
              <Stack gap={1}>
                <Text variant="small">Total adeudado</Text>
                <Title level={1}>
                  <Num>{formatearMoneda(res.totalAdeudado ?? 0)}</Num>
                </Title>
              </Stack>
              <Text variant="muted">
                {res.total} cliente{res.total === 1 ? "" : "s"} con saldo
              </Text>
            </Inline>
          </CardContent>
        </Card>
        {res.data.length === 0 ? (
          <EstadoVacio titulo="Ningún cliente tiene deuda" descripcion="Las ventas en cuenta corriente aparecen acá." />
        ) : (
          <TablaClientes clientes={res.data} />
        )}
        <Paginador page={res.page} pageSize={res.pageSize} total={res.total} />
      </Stack>
    </>
  );
}
