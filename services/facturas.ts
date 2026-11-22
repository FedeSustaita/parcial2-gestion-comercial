import { and, count, desc, eq, gte, inArray, like, lt, or, sql, type SQL } from "drizzle-orm";
import { db, transaccion, type Tx } from "@/db";
import { clientes, facturaItems, facturas, movimientosCuenta, movimientosStock, productos, usuarios } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { finDiaAR, inicioDiaAR } from "@/lib/fechas";
import { formatearDocumento, formatearNumeroComprobante } from "@/lib/format";
import { validar } from "@/lib/validacion";
import type { Paginado } from "@/schemas/comunes";
import { anularFacturaSchema, crearFacturaSchema, listarFacturasSchema } from "@/schemas/facturas";
import type { UsuarioSesion } from "./auth";
import { registrarMovimientoCuenta, saldoCliente, saldoHastaMovimiento } from "./cuenta";
import { PUNTO_DE_VENTA, siguienteNumeroFactura } from "./numeracion";
import { exigirRol } from "./permisos";
import { moverStock } from "./stock";

// Facturación (RF-V1 a RF-V9). La operación central del sistema: confirmar
// una factura toca 5 tablas (facturas, factura_items, productos,
// movimientos_stock y movimientos_cuenta) y se resuelve en UNA transacción.

type FormaPago = "contado" | "tarjeta" | "cuenta_corriente";

export type FacturaPublica = {
  id: number;
  puntoVenta: number;
  numero: number;
  numeroFormateado: string;
  fecha: string;
  estado: "emitida" | "anulada";
  cliente: { id: number; nombre: string; tipoDoc: string; nroDoc: string; domicilio: string | null } | null;
  vendedor: { id: number; nombre: string };
  items: {
    productoId: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
  pago:
    | { forma: "contado"; montoRecibido: number; vuelto: number }
    | { forma: "tarjeta"; tarjeta: { tipo: "debito" | "credito"; marca: string; ultimos4: string } }
    | { forma: "cuenta_corriente" };
  saldoCliente?: number; // solo en ventas a cuenta corriente
  anulacion?: { fecha: string; usuario: { id: number; nombre: string }; motivo: string };
};

/**
 * RF-V1 a RF-V6: emite una factura. Pasos dentro de la transacción (11.6):
 *  1. Valida el cuerpo y que los productos existan y estén activos.
 *  2. Si hay cliente, que esté activo; si es a cuenta, que la tenga habilitada.
 *  3. Comprueba que la existencia alcance (regla 1, primer control).
 *  4. Toma el precio ACTUAL de cada producto y calcula subtotales y total.
 *  5. Contado: el monto recibido cubre el total. Cuenta corriente: el saldo
 *     nuevo no supera el límite (regla 7).
 *  6. Asigna el próximo número correlativo (regla 4).
 *  7. Graba la factura y sus renglones con descripción y precio COPIADOS
 *     del catálogo (regla 3: el precio queda congelado).
 *  8. Descuenta el stock con moverStock() (UPDATE condicionado = segundo
 *     control, atómico frente a otra venta simultánea) y graba un
 *     movimiento de venta por renglón (regla 2).
 *  9. Si es a cuenta corriente, graba el débito en la cuenta del cliente.
 * Si cualquier paso falla, se revierte TODO: no quedan datos parciales.
 */
export async function crearFactura(
  usuario: UsuarioSesion,
  datos: unknown,
  opciones: { fecha?: Date } = {}, // solo para el script de datos iniciales
): Promise<FacturaPublica> {
  const d = validar(crearFacturaSchema, datos); // paso 1 (forma)
  exigirRol(usuario, "admin", "vendedor"); // ambos roles emiten facturas

  const facturaId = await transaccion(async (tx) => {
    // Paso 1: productos existentes y activos.
    const ids = d.items.map((i) => i.productoId);
    const prods = await tx.select().from(productos).where(inArray(productos.id, ids));
    const porId = new Map(prods.map((p) => [p.id, p]));
    const faltantes = ids.filter((id) => !porId.has(id));
    if (faltantes.length) {
      throw new ApiError(404, "NO_ENCONTRADO", "Hay productos que no existen.", faltantes.map((productoId) => ({ productoId })));
    }
    const inactivos = prods.filter((p) => !p.activo);
    if (inactivos.length) {
      throw new ApiError(
        422,
        "PRODUCTO_INACTIVO",
        `No se puede vender un producto dado de baja: ${inactivos.map((p) => p.codigo).join(", ")}.`,
        inactivos.map((p) => ({ productoId: p.id, codigo: p.codigo })),
      );
    }

    // Paso 2: cliente (regla 6: consumidor final no compra en cuenta corriente).
    const cliente = d.clienteId ? await tx.query.clientes.findFirst({ where: eq(clientes.id, d.clienteId) }) : null;
    if (d.clienteId && (!cliente || !cliente.activo)) {
      throw errores.validacion([{ campo: "clienteId", mensaje: "El cliente no existe o está dado de baja." }]);
    }
    if (d.pago.forma === "cuenta_corriente" && (!cliente || !cliente.cuentaCorriente)) {
      throw new ApiError(
        422,
        "CUENTA_CORRIENTE_NO_HABILITADA",
        cliente
          ? "El cliente no tiene cuenta corriente habilitada."
          : "Consumidor final no puede comprar en cuenta corriente: elegí un cliente registrado.",
      );
    }

    // Paso 3: existencia suficiente (se informan todos los productos que fallan).
    const sinStock = d.items
      .map((i) => ({ i, p: porId.get(i.productoId)! }))
      .filter(({ i, p }) => p.existencia < i.cantidad)
      .map(({ i, p }) => ({ productoId: p.id, codigo: p.codigo, solicitado: i.cantidad, disponible: p.existencia }));
    if (sinStock.length) {
      throw new ApiError(409, "STOCK_INSUFICIENTE", "No hay existencia suficiente para algunos productos.", sinStock);
    }

    // Paso 4: precios del servidor (el cliente nunca los manda).
    const renglones = d.items.map((i) => {
      const p = porId.get(i.productoId)!;
      return { p, cantidad: i.cantidad, precioUnitario: p.precio, subtotal: p.precio * i.cantidad };
    });
    const total = renglones.reduce((s, r) => s + r.subtotal, 0);

    // Paso 5: reglas de la forma de pago.
    let montoRecibido: number | null = null;
    if (d.pago.forma === "contado") {
      montoRecibido = d.pago.montoRecibido ?? total;
      if (montoRecibido < total) {
        throw new ApiError(422, "MONTO_INSUFICIENTE", "El monto recibido no cubre el total.", [
          { campo: "montoRecibido", mensaje: "No cubre el total de la venta." },
        ]);
      }
    }
    if (d.pago.forma === "cuenta_corriente" && cliente!.limiteCredito != null) {
      const saldoActual = await saldoCliente(tx, cliente!.id);
      if (saldoActual + total > cliente!.limiteCredito) {
        throw new ApiError(422, "LIMITE_CREDITO_EXCEDIDO", "La venta supera el límite de crédito del cliente.", {
          saldoActual,
          limite: cliente!.limiteCredito,
          excedente: saldoActual + total - cliente!.limiteCredito,
        });
      }
    }

    // Paso 6: número correlativo, asignado recién al confirmar.
    const numero = await siguienteNumeroFactura(tx);
    const numeroTexto = formatearNumeroComprobante(PUNTO_DE_VENTA, numero);

    // Paso 7: factura y renglones (precio y descripción copiados).
    const tarjeta = d.pago.forma === "tarjeta" ? d.pago.tarjeta : null;
    const [f] = await tx
      .insert(facturas)
      .values({
        puntoVenta: PUNTO_DE_VENTA,
        numero,
        clienteId: cliente?.id ?? null,
        usuarioId: usuario.id,
        total,
        formaPago: d.pago.forma,
        tarjetaTipo: tarjeta?.tipo ?? null,
        tarjetaMarca: tarjeta?.marca ?? null,
        tarjetaUltimos4: tarjeta?.ultimos4 ?? null,
        montoRecibido,
        ...(opciones.fecha ? { fecha: opciones.fecha } : {}),
      })
      .returning({ id: facturas.id });

    await tx.insert(facturaItems).values(
      renglones.map((r) => ({
        facturaId: f.id,
        productoId: r.p.id,
        codigo: r.p.codigo,
        descripcion: r.p.descripcion,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        subtotal: r.subtotal,
      })),
    );

    // Paso 8: descuento de stock + movimiento de venta por renglón.
    for (const r of renglones) {
      await moverStock(tx, {
        productoId: r.p.id,
        tipo: "venta",
        cantidad: -r.cantidad,
        motivo: `Venta ${numeroTexto}`,
        usuarioId: usuario.id,
        facturaId: f.id,
      });
    }

    // Paso 9: débito en la cuenta corriente.
    if (d.pago.forma === "cuenta_corriente") {
      await registrarMovimientoCuenta(tx, {
        clienteId: cliente!.id,
        tipo: "debito",
        importe: total,
        descripcion: `Factura ${numeroTexto}`,
        facturaId: f.id,
      });
    }

    if (opciones.fecha) await alinearFechas(tx, f.id, opciones.fecha);
    return f.id;
  });

  return obtenerFactura(usuario, facturaId);
}

// Solo para el seed: los movimientos generados llevan la misma fecha que la factura.
async function alinearFechas(tx: Tx, facturaId: number, fecha: Date) {
  await tx.update(movimientosStock).set({ fecha }).where(eq(movimientosStock.facturaId, facturaId));
  await tx.update(movimientosCuenta).set({ fecha }).where(eq(movimientosCuenta.facturaId, facturaId));
}

/** RF-V7: factura completa (comprobante). Si está anulada, suma `anulacion`. */
export async function obtenerFactura(_usuario: UsuarioSesion, facturaId: unknown): Promise<FacturaPublica> {
  const f = await db.query.facturas.findFirst({
    where: eq(facturas.id, Number(facturaId)),
    with: {
      cliente: true,
      vendedor: { columns: { id: true, nombre: true } },
      anuladaPor: { columns: { id: true, nombre: true } },
      items: { orderBy: (i, { asc }) => [asc(i.id)] },
    },
  });
  if (!f) throw errores.noEncontrado("La factura");

  const pago: FacturaPublica["pago"] =
    f.formaPago === "contado"
      ? { forma: "contado", montoRecibido: f.montoRecibido ?? f.total, vuelto: (f.montoRecibido ?? f.total) - f.total }
      : f.formaPago === "tarjeta"
        ? { forma: "tarjeta", tarjeta: { tipo: f.tarjetaTipo!, marca: f.tarjetaMarca!, ultimos4: f.tarjetaUltimos4! } }
        : { forma: "cuenta_corriente" };

  const res: FacturaPublica = {
    id: f.id,
    puntoVenta: f.puntoVenta,
    numero: f.numero,
    numeroFormateado: formatearNumeroComprobante(f.puntoVenta, f.numero),
    fecha: f.fecha.toISOString(),
    estado: f.estado,
    cliente: f.cliente
      ? {
          id: f.cliente.id,
          nombre: f.cliente.nombre,
          tipoDoc: f.cliente.tipoDoc,
          nroDoc: formatearDocumento(f.cliente.tipoDoc, f.cliente.nroDoc),
          domicilio: f.cliente.domicilio,
        }
      : null,
    vendedor: f.vendedor,
    items: f.items.map((i) => ({
      productoId: i.productoId,
      codigo: i.codigo,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.subtotal,
    })),
    total: f.total,
    pago,
  };

  if (f.formaPago === "cuenta_corriente" && f.clienteId) {
    const debito = await db.query.movimientosCuenta.findFirst({
      where: and(eq(movimientosCuenta.facturaId, f.id), eq(movimientosCuenta.tipo, "debito")),
    });
    res.saldoCliente = debito ? await saldoHastaMovimiento(f.clienteId, debito.id) : await saldoCliente(db, f.clienteId);
  }
  if (f.estado === "anulada" && f.anuladaEn && f.anuladaPor) {
    res.anulacion = { fecha: f.anuladaEn.toISOString(), usuario: f.anuladaPor, motivo: f.motivoAnulacion ?? "" };
  }
  return res;
}

export type FacturaListado = {
  id: number;
  numeroFormateado: string;
  fecha: string;
  cliente: { id: number; nombre: string } | null;
  vendedor: { id: number; nombre: string };
  formaPago: FormaPago;
  total: number;
  estado: "emitida" | "anulada";
};

/**
 * RF-V8: listado de facturas, de la más nueva a la más vieja, sin renglones.
 * Filtros por fechas, cliente, vendedor, forma de pago y estado; búsqueda por
 * número o nombre del cliente. `totalEmitido` suma las emitidas del filtro.
 */
export async function listarFacturas(
  _usuario: UsuarioSesion,
  query: unknown,
): Promise<Paginado<FacturaListado> & { totalEmitido: number }> {
  const f = validar(listarFacturasSchema, query ?? {});
  const c: SQL[] = [];
  if (f.q) {
    const partes = f.q.split("-");
    const numero = Number(partes[partes.length - 1].replace(/\D/g, ""));
    c.push(or(like(clientes.nombre, `%${f.q}%`), numero ? eq(facturas.numero, numero) : undefined)!);
  }
  if (f.desde) c.push(gte(facturas.fecha, inicioDiaAR(f.desde)));
  if (f.hasta) c.push(lt(facturas.fecha, finDiaAR(f.hasta)));
  if (f.clienteId) c.push(eq(facturas.clienteId, f.clienteId));
  if (f.vendedorId) c.push(eq(facturas.usuarioId, f.vendedorId));
  if (f.forma) c.push(eq(facturas.formaPago, f.forma));
  if (f.estado) c.push(eq(facturas.estado, f.estado));
  const where = c.length ? and(...c) : undefined;

  const [filas, [{ total }], [{ emitido }]] = await Promise.all([
    db
      .select({
        id: facturas.id,
        puntoVenta: facturas.puntoVenta,
        numero: facturas.numero,
        fecha: facturas.fecha,
        clienteId: clientes.id,
        clienteNombre: clientes.nombre,
        vendedorId: usuarios.id,
        vendedorNombre: usuarios.nombre,
        formaPago: facturas.formaPago,
        total: facturas.total,
        estado: facturas.estado,
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
      .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
      .where(where)
      .orderBy(desc(facturas.fecha), desc(facturas.numero))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(facturas).leftJoin(clientes, eq(facturas.clienteId, clientes.id)).where(where),
    db
      .select({ emitido: sql<number>`coalesce(sum(${facturas.total}), 0)` })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
      .where(and(where, eq(facturas.estado, "emitida"))),
  ]);

  return {
    data: filas.map((r) => ({
      id: r.id,
      numeroFormateado: formatearNumeroComprobante(r.puntoVenta, r.numero),
      fecha: r.fecha.toISOString(),
      cliente: r.clienteId ? { id: r.clienteId, nombre: r.clienteNombre! } : null,
      vendedor: { id: r.vendedorId, nombre: r.vendedorNombre },
      formaPago: r.formaPago,
      total: r.total,
      estado: r.estado,
    })),
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalEmitido: Number(emitido),
  };
}

/** RF-V1: próximo número, solo informativo (el real se asigna al confirmar). */
export async function proximoNumero(_usuario: UsuarioSesion): Promise<{ numeroFormateado: string }> {
  return { numeroFormateado: formatearNumeroComprobante(PUNTO_DE_VENTA, await siguienteNumeroFactura(db)) };
}

/**
 * RF-V9 / regla 5: anulación (solo admin, motivo obligatorio). En una
 * transacción marca la factura como anulada, reingresa el stock de cada
 * renglón con un movimiento de anulación y, si fue a cuenta corriente,
 * graba un crédito por el total. La factura nunca se borra.
 */
export async function anularFactura(usuario: UsuarioSesion, facturaId: unknown, datos: unknown): Promise<FacturaPublica> {
  const d = validar(anularFacturaSchema, datos);
  exigirRol(usuario, "admin");
  const id = Number(facturaId);

  await transaccion(async (tx) => {
    const f = await tx.query.facturas.findFirst({ where: eq(facturas.id, id), with: { items: true } });
    if (!f) throw errores.noEncontrado("La factura");
    if (f.estado === "anulada") throw new ApiError(409, "FACTURA_ANULADA", "La factura ya estaba anulada.");
    const numeroTexto = formatearNumeroComprobante(f.puntoVenta, f.numero);

    // Marca condicionada al estado: si otra anulación ganó la carrera, no se repite.
    const marcada = await tx
      .update(facturas)
      .set({ estado: "anulada", motivoAnulacion: d.motivo, anuladaEn: new Date(), anuladaPorId: usuario.id })
      .where(and(eq(facturas.id, id), eq(facturas.estado, "emitida")))
      .returning({ id: facturas.id });
    if (!marcada.length) throw new ApiError(409, "FACTURA_ANULADA", "La factura ya estaba anulada.");

    for (const i of f.items) {
      await moverStock(tx, {
        productoId: i.productoId,
        tipo: "anulacion",
        cantidad: i.cantidad,
        motivo: `Anulación ${numeroTexto}`,
        observacion: d.motivo,
        usuarioId: usuario.id,
        facturaId: f.id,
      });
    }
    if (f.formaPago === "cuenta_corriente" && f.clienteId) {
      await registrarMovimientoCuenta(tx, {
        clienteId: f.clienteId,
        tipo: "credito",
        importe: f.total,
        descripcion: `Anulación factura ${numeroTexto}`,
        facturaId: f.id,
      });
    }
  });

  return obtenerFactura(usuario, id);
}
