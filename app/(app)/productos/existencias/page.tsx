import { BarraFiltros, FechaUrl, SelectUrl } from "@/components/comunes/filtros";
import { Paginador } from "@/components/comunes/paginador";
import { PestanasProductos } from "@/components/domain/productos/pestanas-productos";
import { TablaMovimientos } from "@/components/domain/productos/tabla-movimientos";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/primitivas";
import { requerirUsuario } from "@/lib/auth";
import { ETIQUETAS } from "@/lib/format";
import { aQuery } from "@/lib/paginas";
import { listarMovimientos } from "@/services/stock";

// Pestaña «Existencias»: movimientos de stock de todos los productos (RF-P6).
export default async function ExistenciasPage({ searchParams }: PageProps<"/productos/existencias">) {
  const usuario = await requerirUsuario();
  const res = await listarMovimientos(usuario, aQuery(await searchParams));

  return (
    <>
      <PageHeader title="Productos" description="Catálogo, existencias y categorías" />
      <PestanasProductos />
      <Stack gap={4}>
        <BarraFiltros>
          <SelectUrl
            param="tipo"
            etiqueta="Tipo"
            opciones={Object.entries(ETIQUETAS.movStock).map(([valor, texto]) => ({ valor, texto }))}
          />
          <FechaUrl param="desde" etiqueta="Desde" />
          <FechaUrl param="hasta" etiqueta="Hasta" />
        </BarraFiltros>
        <TablaMovimientos movimientos={res.data} conProducto />
        <Paginador page={res.page} pageSize={res.pageSize} total={res.total} />
      </Stack>
    </>
  );
}
