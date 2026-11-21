import { Inline, Stack, Text, Title } from "@/components/layout/primitivas";
import { COMERCIO } from "@/lib/comercio";
import { formatearFechaHora } from "@/lib/format";

/** Encabezado común de factura y recibo: datos del comercio, tipo, número y fecha. */
export function EncabezadoComprobante({ tipo, numero, fecha }: { tipo: string; numero: string; fecha: string }) {
  return (
    <Inline justify="between" align="start" gap={6} className="border-b pb-4">
      <Stack gap={1}>
        <Title level={2}>{COMERCIO.nombre}</Title>
        <Text variant="small">{COMERCIO.razonSocial} · CUIT {COMERCIO.cuit}</Text>
        <Text variant="small">{COMERCIO.domicilio}</Text>
        <Text variant="small">Tel. {COMERCIO.telefono}</Text>
      </Stack>
      <Stack gap={1} className="text-right">
        <Text variant="small" className="tracking-wide uppercase">{tipo}</Text>
        <Title level={2} className="tabular-nums">{numero}</Title>
        <Text variant="muted">{formatearFechaHora(fecha)}</Text>
      </Stack>
    </Inline>
  );
}
