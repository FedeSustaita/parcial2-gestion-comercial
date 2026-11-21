import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Insignia, InsigniaActivo } from "@/components/comunes/insignias";
import { PestanasRuta } from "@/components/comunes/pestanas";
import { AccionesCliente } from "@/components/domain/clientes/acciones-cliente";
import { PageHeader } from "@/components/layout/page-header";
import { Grid, Inline, Num, Stack, Text, Title } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth";
import { formatearMoneda } from "@/lib/format";
import { o404 } from "@/lib/paginas";
import { obtenerCliente } from "@/services/clientes";

// Ficha del cliente (RF-C3). «Cuenta corriente» queda como pestaña dentro de la ficha (sección 4).
export default async function ClienteLayout({ params, children }: LayoutProps<"/clientes/[id]">) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const cliente = await o404(obtenerCliente(usuario, id));

  const dato = (etiqueta: string, valor: React.ReactNode) => (
    <Card className="py-4">
      <CardContent className="px-4">
        <Stack gap={1}>
          <Text variant="small">{etiqueta}</Text>
          {valor}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link href="/clientes">
          <ArrowLeft /> Clientes
        </Link>
      </Button>
      <PageHeader
        title={
          <Inline gap={3}>
            {cliente.nombre}
            <InsigniaActivo activo={cliente.activo} />
          </Inline>
        }
        description={`${cliente.tipoDoc} ${cliente.nroDoc}`}
        actions={<AccionesCliente cliente={cliente} />}
      />
      <Grid cols={3}>
        {dato(
          "Saldo actual",
          <Title level={1} className={cliente.saldo > 0 ? "text-amber-700" : ""}>
            <Num>{formatearMoneda(cliente.saldo)}</Num>
          </Title>,
        )}
        {dato(
          "Cuenta corriente",
          cliente.cuentaCorriente ? (
            <Stack gap={1}>
              <Insignia tono="azul" className="self-start">Habilitada</Insignia>
              <Text variant="muted">
                Límite: {cliente.limiteCredito == null ? "sin límite" : formatearMoneda(cliente.limiteCredito)}
              </Text>
            </Stack>
          ) : (
            <Text variant="muted">No habilitada</Text>
          ),
        )}
        {dato(
          "Disponible para comprar a cuenta",
          <Title level={2}>
            <Num>
              {!cliente.cuentaCorriente ? "—" : cliente.disponible == null ? "Sin límite" : formatearMoneda(cliente.disponible)}
            </Num>
          </Title>,
        )}
      </Grid>
      <PestanasRuta
        items={[
          { href: `/clientes/${cliente.id}`, titulo: "Resumen" },
          { href: `/clientes/${cliente.id}/cuenta`, titulo: "Cuenta corriente" },
        ]}
      />
      {children}
    </>
  );
}
