"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { ETIQUETAS, formatearDia, formatearMoneda } from "@/lib/format";

// Gráficos del tablero con Chart.js + react-chartjs-2 (RF-T2).
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Colores del sistema (mismos tonos que --chart-1..3 en globals.css).
const AZUL = "#2f5fc4";
const COLORES_FORMA = { contado: "#2f5fc4", tarjeta: "#1f9e7a", cuenta_corriente: "#d99a1e" } as const;

const pesosCortos = (centavos: number) =>
  "$ " + new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(centavos / 100);

/** Ventas diarias de los últimos 30 días (siempre 30 barras, con 0 los días sin ventas). */
export function GraficoVentasDiarias({ datos }: { datos: { fecha: string; importe: number }[] }) {
  const opciones: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => formatearDia(datos[items[0].dataIndex].fecha),
          label: (item) => formatearMoneda(item.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 12 } },
      y: { beginAtZero: true, ticks: { callback: (v) => pesosCortos(Number(v)) }, border: { display: false } },
    },
  };
  return (
    <div className="h-64">
      <Bar
        options={opciones}
        data={{
          labels: datos.map((d) => formatearDia(d.fecha).slice(0, 5)), // dd/mm
          datasets: [{ data: datos.map((d) => d.importe), backgroundColor: AZUL, borderRadius: 4, maxBarThickness: 22 }],
        }}
      />
    </div>
  );
}

/** Ventas del mes por forma de pago. */
export function GraficoFormasDePago({
  datos,
}: {
  datos: { forma: "contado" | "tarjeta" | "cuenta_corriente"; importe: number }[];
}) {
  const total = datos.reduce((s, d) => s + d.importe, 0);
  const opciones: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: {
          label: (item) => {
            const v = Number(item.raw);
            return ` ${formatearMoneda(v)} (${total ? Math.round((v / total) * 100) : 0} %)`;
          },
        },
      },
    },
  };
  return (
    <div className="h-64">
      <Doughnut
        options={opciones}
        data={{
          labels: datos.map((d) => ETIQUETAS.formaPago[d.forma]),
          datasets: [{ data: datos.map((d) => d.importe), backgroundColor: datos.map((d) => COLORES_FORMA[d.forma]), borderWidth: 0 }],
        }}
      />
    </div>
  );
}
