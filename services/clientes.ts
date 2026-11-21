import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clientes, facturas, movimientosCuenta } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { formatearDocumento, formatearNumeroComprobante, soloDigitos } from "@/lib/format";
import { validar } from "@/lib/validacion";
import { crearClienteSchema, cuentaClienteSchema, editarClienteSchema, listarClientesSchema } from "@/schemas/clientes";
import type { Paginado } from "@/schemas/comunes";
import type { UsuarioSesion } from "./auth";
import { importeConSigno, movimientosConSaldo, saldoCliente, type MovimientoCuentaPublico } from "./cuenta";

// Clientes y cuenta corriente (RF-C1 a RF-C4, RF-C6, RF-C7). Alta y edición
// las pueden hacer ambos roles (sección 3).

export type ClientePublico = {
  id: number;
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string; // formateado: 28.456.123 / 20-28456123-4
  nombre: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null; // centavos; null = sin límite
  saldo: number; // centavos, calculado (débitos − créditos)
  disponible: number | null; // límite − saldo; null si no tiene límite
  activo: boolean;
};

export type FacturaResumen = {
  id: number;
  numero: string;
  fecha: string;
  total: number;
  formaPago: "contado" | "tarjeta" | "cuenta_corriente";
  estado: "emitida" | "anulada";
};

function aPublico(c: typeof clientes.$inferSelect, saldo: number): ClientePublico {
  return {
    id: c.id,
    tipoDoc: c.tipoDoc,
    nroDoc: formatearDocumento(c.tipoDoc, c.nroDoc),
    nombre: c.nombre,
    domicilio: c.domicilio,
    telefono: c.telefono,
    email: c.email,
    cuentaCorriente: c.cuentaCorriente,
    limiteCredito: c.limiteCredito,
    saldo,
    disponible: c.limiteCredito == null ? null : c.limiteCredito - saldo,
    activo: c.activo,
  };
}

// Saldo por cliente como subconsulta: suma de sus movimientos con signo.
const saldos = db
  .select({
    clienteId: movimientosCuenta.clienteId,
    saldo: sql<number>`sum(${importeConSigno})`.as("saldo"),
  })
  .from(movimientosCuenta)
  .groupBy(movimientosCuenta.clienteId)
  .as("saldos");
const saldoExpr = sql<number>`coalesce(${saldos.saldo}, 0)`;

/**
 * RF-C1 / RF-C6: listado con búsqueda por nombre o documento (sin importar
 * puntos ni guiones) y el saldo de cada cliente. Con conDeuda=true devuelve
 * solo los que deben y agrega `totalAdeudado`.
 */
export async function listarClientes(
  _usuario: UsuarioSesion,
  query: unknown,
): Promise<Paginado<ClientePublico> & { totalAdeudado?: number }> {
  const f = validar(listarClientesSchema, query ?? {});
  const condiciones: SQL[] = [];
  if (f.q) {
    const digitos = soloDigitos(f.q);
    condiciones.push(
      or(like(clientes.nombre, `%${f.q}%`), digitos ? like(clientes.nroDoc, `%${digitos}%`) : undefined)!,
    );
  }
  if (f.activo !== "todos") condiciones.push(eq(clientes.activo, f.activo === "true"));
  if (f.conDeuda) condiciones.push(sql`${saldoExpr} > 0`);
  const where = condiciones.length ? and(...condiciones) : undefined;
  const orden = f.orden ?? (f.conDeuda ? "saldo" : "nombre");

  const base = () => db.select({ cliente: clientes, saldo: saldoExpr }).from(clientes).leftJoin(saldos, eq(saldos.clienteId, clientes.id));
  const [filas, [{ total }]] = await Promise.all([
    base()
      .where(where)
      .orderBy(...(orden === "saldo" ? [desc(saldoExpr), asc(clientes.nombre)] : [asc(clientes.nombre)]))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(clientes).leftJoin(saldos, eq(saldos.clienteId, clientes.id)).where(where),
  ]);

  const res: Paginado<ClientePublico> & { totalAdeudado?: number } = {
    data: filas.map((r) => aPublico(r.cliente, Number(r.saldo))),
    page: f.page,
    pageSize: f.pageSize,
    total,
  };
  if (f.conDeuda) {
    const [{ suma }] = await db
      .select({ suma: sql<number>`coalesce(sum(${saldoExpr}), 0)` })
      .from(clientes)
      .leftJoin(saldos, eq(saldos.clienteId, clientes.id))
      .where(where);
    res.totalAdeudado = Number(suma);
  }
  return res;
}

/** Total adeudado y cantidad de clientes con saldo (para el tablero, RF-T1). */
export async function resumenCuentasCorrientes(): Promise<{ totalAdeudado: number; clientesConSaldo: number }> {
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${saldos.saldo}), 0)`, cantidad: count() })
    .from(saldos)
    .where(sql`${saldos.saldo} > 0`);
  return { totalAdeudado: Number(r.total), clientesConSaldo: r.cantidad };
}

async function buscar(clienteId: number) {
  const c = await db.query.clientes.findFirst({ where: eq(clientes.id, clienteId) });
  if (!c) throw errores.noEncontrado("El cliente");
  return c;
}

/** RF-C3: ficha del cliente con su saldo y sus 6 últimas facturas. */
export async function obtenerCliente(
  _usuario: UsuarioSesion,
  clienteId: unknown,
): Promise<ClientePublico & { ultimasFacturas: FacturaResumen[] }> {
  const c = await buscar(Number(clienteId));
  const [saldo, ultimas] = await Promise.all([
    saldoCliente(db, c.id),
    db.query.facturas.findMany({
      where: eq(facturas.clienteId, c.id),
      orderBy: [desc(facturas.fecha), desc(facturas.id)],
      limit: 6,
    }),
  ]);
  return {
    ...aPublico(c, saldo),
    ultimasFacturas: ultimas.map((f) => ({
      id: f.id,
      numero: formatearNumeroComprobante(f.puntoVenta, f.numero),
      fecha: f.fecha.toISOString(),
      total: f.total,
      formaPago: f.formaPago,
      estado: f.estado,
    })),
  };
}

const documentoDuplicado = () =>
  new ApiError(409, "DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese documento.", [
    { campo: "nroDoc", mensaje: "Ya existe un cliente con ese documento." },
  ]);

async function documentoEnUso(nroDoc: string, excepto?: number) {
  const c = await db.query.clientes.findFirst({ where: eq(clientes.nroDoc, nroDoc) });
  return !!c && c.id !== excepto;
}

/** RF-C2 / RF-V2: alta de cliente. Es la misma que usa el alta rápida desde Nueva venta. */
export async function crearCliente(_usuario: UsuarioSesion, datos: unknown): Promise<ClientePublico> {
  const d = validar(crearClienteSchema, datos);
  if (await documentoEnUso(d.nroDoc)) throw documentoDuplicado();
  const [c] = await db.insert(clientes).values(d).returning();
  return aPublico(c, 0);
}

/**
 * RF-C2 / RF-C7: edición y baja lógica. No se puede desactivar ni quitarle
 * la cuenta corriente a un cliente con saldo distinto de cero.
 */
export async function actualizarCliente(
  _usuario: UsuarioSesion,
  clienteId: unknown,
  datos: unknown,
): Promise<ClientePublico> {
  const d = validar(editarClienteSchema, datos);
  const actual = await buscar(Number(clienteId));

  // Coherencia del documento con el tipo cuando cambia solo uno de los dos.
  if (d.tipoDoc || d.nroDoc) {
    validar(crearClienteSchema, {
      tipoDoc: d.tipoDoc ?? actual.tipoDoc,
      nroDoc: d.nroDoc ?? actual.nroDoc,
      nombre: actual.nombre,
    });
  }
  if (d.nroDoc && (await documentoEnUso(d.nroDoc, actual.id))) throw documentoDuplicado();

  const saldo = await saldoCliente(db, actual.id);
  if (saldo !== 0 && (d.activo === false || d.cuentaCorriente === false)) {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      "El cliente tiene saldo pendiente: no se puede dar de baja ni quitarle la cuenta corriente.",
    );
  }

  if (Object.keys(d).length) await db.update(clientes).set(d).where(eq(clientes.id, actual.id));
  const [c] = await db.select().from(clientes).where(eq(clientes.id, actual.id));
  return aPublico(c, saldo);
}

/** RF-C4: cuenta corriente del cliente en orden cronológico con saldo acumulado. */
export async function cuentaCliente(
  _usuario: UsuarioSesion,
  clienteId: unknown,
  query: unknown,
): Promise<{
  cliente: { id: number; nombre: string };
  saldoAnterior: number;
  movimientos: MovimientoCuentaPublico[];
  saldo: number;
}> {
  const f = validar(cuentaClienteSchema, query ?? {});
  const c = await buscar(Number(clienteId));
  const r = await movimientosConSaldo(c.id, f);
  return { cliente: { id: c.id, nombre: c.nombre }, ...r };
}
