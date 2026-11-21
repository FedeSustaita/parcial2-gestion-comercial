import Link from "next/link";
import { Insignia, InsigniaActivo } from "@/components/comunes/insignias";
import { MarcoTabla } from "@/components/comunes/tabla";
import { Num } from "@/components/layout/primitivas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearMoneda } from "@/lib/format";
import type { ClientePublico } from "@/services/clientes";

/** Tabla de clientes con su saldo (RF-C1, RF-C6). */
export function TablaClientes({ clientes, conEstado = false }: { clientes: ClientePublico[]; conEstado?: boolean }) {
  return (
    <MarcoTabla>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Cuenta corriente</TableHead>
            <TableHead className="text-right">Límite</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            {conEstado && <TableHead>Estado</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((c) => (
            <TableRow key={c.id} className={c.activo ? "" : "opacity-60"}>
              <TableCell className="font-medium">
                <Link href={`/clientes/${c.id}`} className="hover:underline">
                  {c.nombre}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="text-muted-foreground">{c.tipoDoc}</span> <Num>{c.nroDoc}</Num>
              </TableCell>
              <TableCell className="whitespace-nowrap">{c.telefono ?? "—"}</TableCell>
              <TableCell>
                {c.cuentaCorriente ? <Insignia tono="azul">Habilitada</Insignia> : <Insignia>No</Insignia>}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Num>{c.cuentaCorriente ? (c.limiteCredito == null ? "Sin límite" : formatearMoneda(c.limiteCredito)) : "—"}</Num>
              </TableCell>
              <TableCell className={c.saldo > 0 ? "text-right font-semibold whitespace-nowrap" : "text-right whitespace-nowrap text-muted-foreground"}>
                <Num>{formatearMoneda(c.saldo)}</Num>
              </TableCell>
              {conEstado && (
                <TableCell>
                  <InsigniaActivo activo={c.activo} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MarcoTabla>
  );
}
