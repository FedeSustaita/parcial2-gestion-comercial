import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

export const NOMBRE_COMERCIO = "Ferretería El Tornillo";

/** Logo + nombre del comercio. */
export function Marca({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Store className="size-4" />
      </span>
      <span className="truncate">{NOMBRE_COMERCIO}</span>
    </div>
  );
}
