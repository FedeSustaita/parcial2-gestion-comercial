import { Plus } from "lucide-react";
import { EstadoVacio } from "@/components/comunes/estados";
import { BarraFiltros, BusquedaUrl } from "@/components/comunes/filtros";
import { InsigniaActivo, InsigniaRol } from "@/components/comunes/insignias";
import { Paginador } from "@/components/comunes/paginador";
import { MarcoTabla } from "@/components/comunes/tabla";
import { AccionesUsuario } from "@/components/domain/usuarios/acciones-usuario";
import { DialogoUsuario } from "@/components/domain/usuarios/dialogo-usuario";
import { PageHeader } from "@/components/layout/page-header";
import { Stack, TextoEnLinea } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requerirAdmin } from "@/lib/auth";
import { formatearFecha } from "@/lib/format";
import { aQuery } from "@/lib/paginas";
import { listarUsuarios } from "@/services/usuarios";

// RF-U4: gestión de usuarios (solo administrador).
export default async function UsuariosPage({ searchParams }: PageProps<"/usuarios">) {
  const usuario = await requerirAdmin();
  const res = await listarUsuarios(usuario, aQuery(await searchParams));

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Altas, roles y contraseñas"
        actions={
          <DialogoUsuario
            disparador={
              <Button>
                <Plus /> Nuevo usuario
              </Button>
            }
          />
        }
      />
      <Stack gap={4}>
        <BarraFiltros>
          <BusquedaUrl placeholder="Buscar por nombre o email" />
        </BarraFiltros>
        {res.data.length === 0 ? (
          <EstadoVacio titulo="No hay usuarios que coincidan" />
        ) : (
          <MarcoTabla>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {res.data.map((u) => (
                  <TableRow key={u.id} className={u.activo ? "" : "opacity-60"}>
                    <TableCell className="font-medium">
                      {u.nombre}
                      {u.id === usuario.id && <TextoEnLinea variant="small" className="ml-2">(vos)</TextoEnLinea>}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <InsigniaRol rol={u.rol} />
                    </TableCell>
                    <TableCell>
                      <InsigniaActivo activo={u.activo} />
                    </TableCell>
                    <TableCell>{formatearFecha(u.creadoEn)}</TableCell>
                    <TableCell>
                      <AccionesUsuario usuario={u} esYo={u.id === usuario.id} />
                    </TableCell>
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
