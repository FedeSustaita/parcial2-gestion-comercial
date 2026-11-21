import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InsigniaActivo, InsigniaBajoMinimo } from "@/components/comunes/insignias";
import { Paginador } from "@/components/comunes/paginador";
import { AccionesProducto } from "@/components/domain/productos/acciones-producto";
import { TablaMovimientos } from "@/components/domain/productos/tabla-movimientos";
import { PageHeader } from "@/components/layout/page-header";
import { Grid, Inline, Num, Stack, Text, Title } from "@/components/layout/primitivas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth";
import { formatearMoneda } from "@/lib/format";
import { aQuery, o404 } from "@/lib/paginas";
import { listarCategorias } from "@/services/categorias";
import { obtenerProducto } from "@/services/productos";
import { listarMovimientosProducto } from "@/services/stock";

// Ficha del producto con su historial de movimientos (RF-P6).
export default async function ProductoPage({ params, searchParams }: PageProps<"/productos/[id]">) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const query = aQuery(await searchParams);
  const producto = await o404(obtenerProducto(usuario, id));
  const [movs, categorias] = await Promise.all([
    listarMovimientosProducto(usuario, id, query),
    usuario.rol === "admin" ? listarCategorias(usuario) : Promise.resolve([]),
  ]);

  const dato = (etiqueta: string, valor: React.ReactNode) => (
    <Card className="py-4">
      <CardContent className="px-4">
        <Stack gap={1}>
          <Text variant="small">{etiqueta}</Text>
          {valor}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link href="/productos">
          <ArrowLeft /> Catálogo
        </Link>
      </Button>
      <PageHeader
        title={
          <Inline gap={3}>
            {producto.descripcion}
            <InsigniaActivo activo={producto.activo} />
          </Inline>
        }
        description={`${producto.codigo} · ${producto.categoria.nombre}`}
        actions={usuario.rol === "admin" && <AccionesProducto producto={producto} categorias={categorias} />}
      />
      <Grid cols={4}>
        {dato("Precio de venta", <Title level={2}><Num>{formatearMoneda(producto.precio)}</Num></Title>)}
        {dato(
          "Existencia",
          <Inline gap={2}>
            <Title level={2} className={producto.bajoMinimo ? "text-amber-700" : ""}>
              <Num>{producto.existencia}</Num>
            </Title>
            {producto.bajoMinimo && <InsigniaBajoMinimo />}
          </Inline>,
        )}
        {dato("Stock mínimo", <Title level={2}><Num>{producto.stockMinimo}</Num></Title>)}
        {dato("Categoría", <Title level={2}>{producto.categoria.nombre}</Title>)}
      </Grid>
      <Stack gap={3}>
        <Title level={2}>Movimientos de stock</Title>
        <TablaMovimientos movimientos={movs.data} />
        <Paginador page={movs.page} pageSize={movs.pageSize} total={movs.total} />
      </Stack>
    </>
  );
}
