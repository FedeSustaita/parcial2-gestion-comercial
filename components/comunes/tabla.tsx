import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Contenedor de tablas: borde, fondo y scroll horizontal en pantallas chicas. */
export function MarcoTabla({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Card className={cn("gap-0 overflow-hidden py-0", className)}>{children}</Card>;
}
