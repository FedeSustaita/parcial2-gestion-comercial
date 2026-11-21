import { Plus } from "lucide-react";
import Link from "next/link";
import { EstadoVacio } from "@/components/comunes/estados";
import { BarraFiltros, BusquedaUrl, CheckUrl, SelectUrl } from "@/components/comunes/filtros";
import { InsigniaActivo, InsigniaBajoMinimo } from "@/components/comunes/insignias";
import { Paginador } from "@/components/comunes/paginador";
import { MarcoTabla } from "@/components/comunes/tabla";
import { DialogoProducto } from "@/components/domain/productos/dialogo-producto";
import { PestanasProductos } from "@/components/domain/productos/pestanas-productos";
import { PageHeader } from "@/components/layout/page-header";
import { Num, Stack } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { formatearMoneda } from "@/lib/format";
import { aQuery } from "@/lib/paginas";
import { listarCategorias } from "@/services/categorias";
import { listarProductos } from "@/services/productos";

// RF-P1: catálogo paginado con búsqueda, filtro por categoría y marca de bajo mínimo.
export default async function ProductosPage({ searchParams }: PageProps<"/productos">) {
  const usuario = await requerirUsuario();
  const query = aQuery(await searchParams);
  const esAdmin = usuario.rol === "admin";
  const [res, categorias] = await Promise.all([listarProductos(usuario, query), listarCategorias(usuario)]);
  const hayFiltros = Object.keys(query).some((k) => k !== "page");

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo, existencias y categorías"
        actions={
          esAdmin && (
            <DialogoProducto
              categorias={categorias}
              disparador={
                <Button>
                  <Plus /> Nuevo producto
                </Button>
              }
            />
          )
        }
      />
      <PestanasProductos />
      <Stack gap={4}>
        <BarraFiltros>
          <BusquedaUrl placeholder="Buscar por código o descripción" />
          <SelectUrl
            param="categoriaId"
            etiqueta="Categoría"
            textoTodos="Todas"
            opciones={categorias.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
          />
          <CheckUrl param="bajoMinimo" etiqueta="Solo bajo mínimo" />
          {esAdmin && <CheckUrl param="activo" valorActivo="todos" etiqueta="Incluir dados de baja" />}
        </BarraFiltros>

        {res.data.length === 0 ? (
          <EstadoVacio
            titulo={hayFiltros ? "Ningún producto coincide con la búsqueda" : "Todavía no hay productos"}
            descripcion={hayFiltros ? "Probá con otros filtros." : undefined}
          />
        ) : (
          <MarcoTabla>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  {esAdmin && <TableHead>Estado</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {res.data.map((p) => (
                  <TableRow key={p.id} className={p.activo ? "" : "opacity-60"}>
                    <TableCell className="font-medium">
                      <Link href={`/productos/${p.id}`} className="hover:underline">
                        {p.codigo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/productos/${p.id}`} className="hover:underline">
                        {p.descripcion}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.categoria.nombre}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Num>{formatearMoneda(p.precio)}</Num>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        {p.bajoMinimo && <InsigniaBajoMinimo />}
                        <Num className={p.bajoMinimo ? "font-semibold text-amber-700" : ""}>{p.existencia}</Num>
                      </span>
                    </TableCell>
                    {esAdmin && (
                      <TableCell>
                        <InsigniaActivo activo={p.activo} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </MarcoTabla>
        )}
        <Paginador page={res.page} pageSize={res.pageSize} total={res.total} />
      </Stack>
    </>
  );
}
