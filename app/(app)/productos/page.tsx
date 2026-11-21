import { EstadoVacio } from "@/components/comunes/estados";
import { PageHeader } from "@/components/layout/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Productos" description="Catálogo, existencias y categorías" />
      <EstadoVacio titulo="Módulo en construcción" descripcion="Se implementa en la Etapa 2." />
    </>
  );
}
