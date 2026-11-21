import { EstadoVacio } from "@/components/comunes/estados";
import { PageHeader } from "@/components/layout/page-header";
import { requerirUsuario } from "@/lib/auth";

// Inicio: el tablero con indicadores y gráficos (RF-T1 a RF-T3) llega en la Etapa 5.
export default async function InicioPage() {
  const usuario = await requerirUsuario();
  return (
    <>
      <PageHeader title={`Hola, ${usuario.nombre.split(" ")[0]}`} description="Resumen del comercio" />
      <EstadoVacio titulo="Tablero en construcción" descripcion="Los indicadores y gráficos se agregan en la Etapa 5." />
    </>
  );
}
