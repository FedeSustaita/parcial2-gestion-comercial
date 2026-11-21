import { EstadoVacio } from "@/components/comunes/estados";
import { PageHeader } from "@/components/layout/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Ventas" description="Nueva venta, facturas y anulaciones" />
      <EstadoVacio titulo="Módulo en construcción" descripcion="Se implementa en la Etapa 4." />
    </>
  );
}
