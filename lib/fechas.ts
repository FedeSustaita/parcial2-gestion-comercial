// Utilidades de fechas en hora de Argentina (UTC−3, sin horario de verano).
// Los filtros por día (desde, hasta) llegan como "AAAA-MM-DD" y se
// interpretan en hora de Argentina (sección 11.1).

const OFFSET = "-03:00";
const DIA_MS = 24 * 60 * 60 * 1000;

/** Inicio del día "AAAA-MM-DD" en Argentina, como Date UTC. */
export function inicioDiaAR(dia: string): Date {
  return new Date(`${dia}T00:00:00${OFFSET}`);
}

/** Inicio del día siguiente (límite exclusivo para filtrar "hasta"). */
export function finDiaAR(dia: string): Date {
  return new Date(inicioDiaAR(dia).getTime() + DIA_MS);
}

/** Día de calendario en Argentina ("AAAA-MM-DD") de un instante. */
export function diaAR(fecha: Date = new Date()): string {
  return new Date(fecha.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Primer día del mes en curso en Argentina ("AAAA-MM-01"). */
export function inicioMesAR(fecha: Date = new Date()): string {
  return `${diaAR(fecha).slice(0, 7)}-01`;
}

/** Suma días a un "AAAA-MM-DD". */
export function sumarDias(dia: string, n: number): string {
  return new Date(inicioDiaAR(dia).getTime() + n * DIA_MS + 12 * 3600 * 1000).toISOString().slice(0, 10);
}
