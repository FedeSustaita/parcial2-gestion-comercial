import { Plus } from "lucide-react";
import { EstadoVacio } from "@/components/comunes/estados";
import { BarraFiltros, BusquedaUrl, CheckUrl } from "@/components/comunes/filtros";
import { Paginador } from "@/components/comunes/paginador";
import { DialogoCliente } from "@/components/domain/clientes/dialogo-cliente";
import { PestanasClientes } from "@/components/domain/clientes/pestanas-clientes";
import { TablaClientes } from "@/components/domain/clientes/tabla-clientes";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { requerirUsuario } from "@/lib/auth";
import { aQuery } from "@/lib/paginas";
import { listarClientes } from "@/services/clientes";

// RF-C1: listado con búsqueda por nombre o documento y el saldo de cada cliente.
export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  const usuario = await requerirUsuario();
  const query = aQuery(await searchParams);
  const res = await listarClientes(usuario, query);
  const hayFiltros = Object.keys(query).some((k) => k !== "page");

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cuentas corrientes, pagos y saldos"
        actions={
          <DialogoCliente
            disparador={
              <Button>
                <Plus /> Nuevo cliente
              </Button>
            }
          />
        }
      />
      <PestanasClientes />
      <Stack gap={4}>
        <BarraFiltros>
          <BusquedaUrl placeholder="Buscar por nombre o documento" />
          <CheckUrl param="activo" valorActivo="todos" etiqueta="Incluir dados de baja" />
        </BarraFiltros>
        {res.data.length === 0 ? (
          <EstadoVacio
            titulo={hayFiltros ? "Ningún cliente coincide con la búsqueda" : "Todavía no hay clientes"}
            descripcion={hayFiltros ? "Probá con otro nombre o documento." : undefined}
          />
        ) : (
          <TablaClientes clientes={res.data} conEstado={query.activo === "todos"} />
        )}
        <Paginador page={res.page} pageSize={res.pageSize} total={res.total} />
      </Stack>
    </>
  );
}
