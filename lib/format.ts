// Módulo ÚNICO de formatos (sección 10.6): moneda, fechas, horas, documentos
// y numeración. Los componentes no formatean por su cuenta: llaman a estas
// funciones. Hora de Argentina (UTC−3) en todas las fechas.

const ZONA = "America/Argentina/Buenos_Aires";

const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234550 (centavos) → "$ 12.345,50" (regla 10). */
export function formatearMoneda(centavos: number | null | undefined): string {
  if (centavos == null) return "—";
  return moneda.format(centavos / 100).replace(/ /g, " ");
}

const fecha = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const hora = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function aDate(valor: Date | string | number): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

/** → "29/10/2026" */
export function formatearFecha(valor: Date | string | number | null | undefined): string {
  if (valor == null) return "—";
  return fecha.format(aDate(valor));
}

/** → "18:24" */
export function formatearHora(valor: Date | string | number): string {
  return hora.format(aDate(valor));
}

/** → "29/10/2026 18:24" */
export function formatearFechaHora(valor: Date | string | number | null | undefined): string {
  if (valor == null) return "—";
  return `${formatearFecha(valor)} ${formatearHora(valor)}`;
}

/** "2026-10-29" (día de calendario, sin hora) → "29/10/2026" */
export function formatearDia(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** (1, 1233) → "0001-00001233" (regla 4). */
export function formatearNumeroComprobante(puntoVenta: number, numero: number): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
}

/** (1, 341) → "R 0001-00000341" */
export function formatearNumeroRecibo(puntoVenta: number, numero: number): string {
  return `R ${formatearNumeroComprobante(puntoVenta, numero)}`;
}

/** Deja solo los dígitos de un documento: "28.456.123" → "28456123". */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** DNI "28456123" → "28.456.123"; CUIT "20284561234" → "20-28456123-4". */
export function formatearDocumento(tipo: string, nro: string): string {
  const d = soloDigitos(nro);
  if (tipo === "CUIT" && d.length === 11) return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Convierte lo que escribe el usuario en pesos a centavos enteros, sin pasar
 * por coma flotante. Acepta "12.345,50", "12345,5", "12345.50" o "12345".
 * Devuelve null si no es un importe válido.
 */
export function pesosACentavos(texto: string): number | null {
  let t = texto.trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!t) return null;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if ((t.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(t)) {
    t = t.replace(/\./g, ""); // "12.345" = miles
  }
  const m = /^(\d+)(?:\.(\d{0,2}))?$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** 1234550 → "12345,50" (valor inicial de un campo de importe). */
export function centavosATexto(centavos: number | null | undefined): string {
  if (centavos == null) return "";
  const entero = Math.trunc(centavos / 100);
  const dec = String(Math.abs(centavos % 100)).padStart(2, "0");
  return `${entero},${dec}`;
}

export const ETIQUETAS = {
  rol: { admin: "Administrador", vendedor: "Vendedor" },
  formaPago: { contado: "Contado", tarjeta: "Tarjeta", cuenta_corriente: "Cuenta corriente" },
  tipoTarjeta: { debito: "Débito", credito: "Crédito" },
  medioPago: { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta_debito: "Tarjeta de débito" },
  movStock: { venta: "Venta", anulacion: "Anulación", ingreso: "Ingreso", egreso: "Egreso" },
  movCuenta: { debito: "Débito", credito: "Crédito" },
  estadoFactura: { emitida: "Emitida", anulada: "Anulada" },
} as const;
