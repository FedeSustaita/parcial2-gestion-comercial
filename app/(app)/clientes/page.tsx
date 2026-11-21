import { EstadoVacio } from "@/components/comunes/estados";
import { PageHeader } from "@/components/layout/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Clientes" description="Cuentas corrientes, pagos y saldos" />
      <EstadoVacio titulo="Módulo en construcción" descripcion="Se implementa en la Etapa 3." />
    </>
  );
}
