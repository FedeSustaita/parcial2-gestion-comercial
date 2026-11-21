import { Badge } from "@/components/ui/badge";
import { ETIQUETAS } from "@/lib/format";
import { cn } from "@/lib/utils";

// Insignias de estado reutilizables (sección 10.6).

const TONOS = {
  verde: "border-transparent bg-emerald-100 text-emerald-800",
  rojo: "border-transparent bg-red-100 text-red-800",
  ambar: "border-transparent bg-amber-100 text-amber-800",
  gris: "border-transparent bg-muted text-muted-foreground",
  azul: "border-transparent bg-primary/10 text-primary",
} as const;

export function Insignia({
  tono = "gris",
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { tono?: keyof typeof TONOS }) {
  return <Badge variant="outline" className={cn(TONOS[tono], className)} {...props} />;
}

export function InsigniaActivo({ activo }: { activo: boolean }) {
  return <Insignia tono={activo ? "verde" : "gris"}>{activo ? "Activo" : "Inactivo"}</Insignia>;
}

export function InsigniaEstadoFactura({ estado }: { estado: "emitida" | "anulada" }) {
  return <Insignia tono={estado === "emitida" ? "verde" : "rojo"}>{ETIQUETAS.estadoFactura[estado]}</Insignia>;
}

export function InsigniaBajoMinimo() {
  return <Insignia tono="ambar">Bajo mínimo</Insignia>;
}

export function InsigniaRol({ rol }: { rol: "admin" | "vendedor" }) {
  return <Insignia tono={rol === "admin" ? "azul" : "gris"}>{ETIQUETAS.rol[rol]}</Insignia>;
}
