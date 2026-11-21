import { EstadoVacio } from "@/components/comunes/estados";
import { PageHeader } from "@/components/layout/page-header";
import { requerirAdmin } from "@/lib/auth";

export default async function Page() {
  await requerirAdmin();
  return (
    <>
      <PageHeader title="Usuarios" description="Altas, roles y contraseñas" />
      <EstadoVacio titulo="Módulo en construcción" descripcion="Se implementa en la Etapa 2." />
    </>
  );
}
