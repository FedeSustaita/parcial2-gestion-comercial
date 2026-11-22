import { eq } from "drizzle-orm";
import { db, transaccion } from "@/db";
import { clientes, movimientosCuenta, pagos } from "@/db/schema";
import { ApiError, errores } from "@/lib/api-error";
import { formatearDocumento, formatearNumeroRecibo } from "@/lib/format";
import { validar } from "@/lib/validacion";
import { registrarPagoSchema } from "@/schemas/clientes";
import type { UsuarioSesion } from "./auth";
import { registrarMovimientoCuenta, saldoCliente, saldoHastaMovimiento } from "./cuenta";
import { PUNTO_DE_VENTA, siguienteNumeroRecibo } from "./numeracion";

// Pagos a cuenta corriente con recibo numerado (RF-C5).

export type ReciboPublico = {
  id: number;
  numeroRecibo: string; // "R 0001-00000341"
  fecha: string;
  cliente: { id: number; nombre: string; tipoDoc: string; nroDoc: string; domicilio: string | null };
  importe: number;
  medio: "efectivo" | "transferencia" | "tarjeta_debito";
  observacion: string | null;
  usuario: { id: number; nombre: string };
  saldoCliente: number; // saldo después de este pago
};

/**
 * RF-C5: registra un pago. En UNA transacción graba el pago con su número de
 * recibo y el crédito en la cuenta corriente.
 * - Regla 8: un pago no puede superar la deuda (no hay saldos a favor).
 * - Solo para clientes con cuenta corriente habilitada.
 */
export async function registrarPago(
  usuario: UsuarioSesion,
  clienteId: unknown,
  datos: unknown,
  opciones: { fecha?: Date } = {}, // solo para el script de datos iniciales
): Promise<ReciboPublico> {
  const d = validar(registrarPagoSchema, datos);
  const id = Number(clienteId);

  const pagoId = await transaccion(async (tx) => {
    const c = await tx.query.clientes.findFirst({ where: eq(clientes.id, id) });
    if (!c) throw errores.noEncontrado("El cliente");
    if (!c.cuentaCorriente) {
      throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "El cliente no tiene cuenta corriente habilitada.");
    }

    const saldo = await saldoCliente(tx, id);
    if (d.importe > saldo) {
      throw new ApiError(422, "PAGO_SUPERA_DEUDA", "El pago no puede superar la deuda del cliente.", [
        { campo: "importe", mensaje: "No puede superar la deuda actual." },
      ]);
    }

    const numero = await siguienteNumeroRecibo(tx);
    const [p] = await tx
      .insert(pagos)
      .values({
        puntoVenta: PUNTO_DE_VENTA,
        numero,
        clienteId: id,
        usuarioId: usuario.id,
        importe: d.importe,
        medio: d.medio,
        observacion: d.observacion,
        ...(opciones.fecha ? { fecha: opciones.fecha } : {}),
      })
      .returning({ id: pagos.id, fecha: pagos.fecha });

    const mov = await registrarMovimientoCuenta(tx, {
      clienteId: id,
      tipo: "credito",
      importe: d.importe,
      descripcion: `Recibo ${formatearNumeroRecibo(PUNTO_DE_VENTA, numero)}`,
      pagoId: p.id,
    });
    if (opciones.fecha) await tx.update(movimientosCuenta).set({ fecha: p.fecha }).where(eq(movimientosCuenta.id, mov.id));
    return p.id;
  });

  return obtenerPago(usuario, pagoId);
}

/** GET /api/pagos/{id}: el mismo objeto del recibo, para reimprimirlo. */
export async function obtenerPago(_usuario: UsuarioSesion, pagoId: unknown): Promise<ReciboPublico> {
  const p = await db.query.pagos.findFirst({
    where: eq(pagos.id, Number(pagoId)),
    with: { cliente: true, usuario: { columns: { id: true, nombre: true } } },
  });
  if (!p) throw errores.noEncontrado("El pago");
  const mov = await db.query.movimientosCuenta.findFirst({ where: eq(movimientosCuenta.pagoId, p.id) });

  return {
    id: p.id,
    numeroRecibo: formatearNumeroRecibo(p.puntoVenta, p.numero),
    fecha: p.fecha.toISOString(),
    cliente: {
      id: p.cliente.id,
      nombre: p.cliente.nombre,
      tipoDoc: p.cliente.tipoDoc,
      nroDoc: formatearDocumento(p.cliente.tipoDoc, p.cliente.nroDoc),
      domicilio: p.cliente.domicilio,
    },
    importe: p.importe,
    medio: p.medio,
    observacion: p.observacion,
    usuario: p.usuario,
    saldoCliente: mov ? await saldoHastaMovimiento(p.clienteId, mov.id) : 0,
  };
}
