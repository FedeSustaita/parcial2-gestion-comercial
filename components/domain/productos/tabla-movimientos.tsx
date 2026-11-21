import Link from "next/link";
import { EstadoVacio } from "@/components/comunes/estados";
import { Insignia } from "@/components/comunes/insignias";
import { MarcoTabla } from "@/components/comunes/tabla";
import { Num } from "@/components/layout/primitivas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ETIQUETAS, formatearFechaHora } from "@/lib/format";
import type { MovimientoStockPublico } from "@/services/stock";

const TONO = { venta: "azul", anulacion: "rojo", ingreso: "verde", egreso: "ambar" } as const;

/** RF-P6: fecha, tipo, cantidad, existencia resultante, usuario y referencia a la factura. */
export function TablaMovimientos({
  movimientos,
  conProducto = false,
}: {
  movimientos: MovimientoStockPublico[];
  conProducto?: boolean;
}) {
  if (movimientos.length === 0) {
    return <EstadoVacio titulo="Sin movimientos" descripcion="No hay movimientos de stock para mostrar." />;
  }
  return (
    <MarcoTabla>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            {conProducto && <TableHead>Producto</TableHead>}
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Existencia</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="whitespace-nowrap">{formatearFechaHora(m.fecha)}</TableCell>
              {conProducto && (
                <TableCell>
                  <Link href={`/productos/${m.producto.id}`} className="font-medium hover:underline">
                    {m.producto.codigo}
                  </Link>{" "}
                  <span className="text-muted-foreground">{m.producto.descripcion}</span>
                </TableCell>
              )}
              <TableCell>
                <Insignia tono={TONO[m.tipo]}>{ETIQUETAS.movStock[m.tipo]}</Insignia>
              </TableCell>
              <TableCell className={m.cantidad > 0 ? "text-right text-emerald-700" : "text-right text-red-700"}>
                <Num>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</Num>
              </TableCell>
              <TableCell className="text-right">
                <Num>{m.existenciaResultante}</Num>
              </TableCell>
              <TableCell>
                {m.motivo}
                {m.observacion && <span className="block text-xs text-muted-foreground">{m.observacion}</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap">{m.usuario.nombre}</TableCell>
              <TableCell className="whitespace-nowrap">
                {m.referencia ? (
                  <Link href={`/ventas/${m.referencia.facturaId}`} className="text-primary hover:underline">
                    Factura {m.referencia.numero}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MarcoTabla>
  );
}
