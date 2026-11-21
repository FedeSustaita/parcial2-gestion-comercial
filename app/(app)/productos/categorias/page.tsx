import { Plus } from "lucide-react";
import { EstadoVacio } from "@/components/comunes/estados";
import { InsigniaActivo } from "@/components/comunes/insignias";
import { MarcoTabla } from "@/components/comunes/tabla";
import { AccionesCategoria } from "@/components/domain/productos/acciones-categoria";
import { DialogoCategoria } from "@/components/domain/productos/dialogo-categoria";
import { PestanasProductos } from "@/components/domain/productos/pestanas-productos";
import { PageHeader } from "@/components/layout/page-header";
import { Num } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirUsuario } from "@/lib/auth";
import { listarCategorias } from "@/services/categorias";

// Pestaña «Categorías» (RF-P7). El vendedor solo consulta.
export default async function CategoriasPage() {
  const usuario = await requerirUsuario();
  const esAdmin = usuario.rol === "admin";
  const categorias = await listarCategorias(usuario, { todas: true });

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo, existencias y categorías"
        actions={
          esAdmin && (
            <DialogoCategoria
              disparador={
                <Button>
                  <Plus /> Nueva categoría
                </Button>
              }
            />
          )
        }
      />
      <PestanasProductos />
      {categorias.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay categorías" />
      ) : (
        <MarcoTabla>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Productos activos</TableHead>
                <TableHead>Estado</TableHead>
                {esAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-right">
                    <Num>{c.productosActivos}</Num>
                  </TableCell>
                  <TableCell>
                    <InsigniaActivo activo={c.activa} />
                  </TableCell>
                  {esAdmin && (
                    <TableCell>
                      <AccionesCategoria categoria={c} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MarcoTabla>
      )}
    </>
  );
}
