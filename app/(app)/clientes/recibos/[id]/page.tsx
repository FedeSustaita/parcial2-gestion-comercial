import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BotonImprimir } from "@/components/comunes/imprimir";
import { EncabezadoComprobante } from "@/components/domain/encabezado-comprobante";
import { Inline, Num, Stack, Text, Title } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth";
import { COMERCIO } from "@/lib/comercio";
import { ETIQUETAS, formatearMoneda } from "@/lib/format";
import { o404 } from "@/lib/paginas";
import { obtenerPago } from "@/services/pagos";

// RF-C5: recibo de pago numerado e imprimible.
export default async function ReciboPage({ params }: PageProps<"/clientes/recibos/[id]">) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const r = await o404(obtenerPago(usuario, id));

  const fila = (etiqueta: string, valor: React.ReactNode) => (
    <Inline justify="between" className="border-b py-2 last:border-0">
      <Text variant="muted">{etiqueta}</Text>
      <Text variant="strong">{valor}</Text>
    </Inline>
  );

  return (
    <>
      <Inline justify="between" className="print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clientes/${r.cliente.id}/cuenta`}>
            <ArrowLeft /> Cuenta corriente de {r.cliente.nombre}
          </Link>
        </Button>
        <BotonImprimir texto="Imprimir recibo" />
      </Inline>

      <Card className="mx-auto w-full max-w-2xl print:border-0 print:shadow-none">
        <CardContent>
          <Stack gap={6}>
            <EncabezadoComprobante tipo="Recibo de pago" numero={r.numeroRecibo} fecha={r.fecha} />
            <Stack gap={1}>
              <Text variant="small">Recibimos de</Text>
              <Title level={3}>{r.cliente.nombre}</Title>
              <Text variant="muted">
                {r.cliente.tipoDoc} {r.cliente.nroDoc}
                {r.cliente.domicilio && ` · ${r.cliente.domicilio}`}
              </Text>
            </Stack>
            <Stack gap={0}>
              {fila("Importe recibido", <Num className="text-lg">{formatearMoneda(r.importe)}</Num>)}
              {fila("Medio de pago", ETIQUETAS.medioPago[r.medio])}
              {r.observacion && fila("Observación", r.observacion)}
              {fila("Saldo de la cuenta después del pago", <Num>{formatearMoneda(r.saldoCliente)}</Num>)}
              {fila("Atendió", r.usuario.nombre)}
            </Stack>
            <Text variant="small" className="text-center">
              {COMERCIO.leyenda}
            </Text>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
