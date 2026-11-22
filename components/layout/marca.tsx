import { HardHat } from "lucide-react";
import { COMERCIO } from "@/lib/comercio";
import { cn } from "@/lib/utils";

/** Logo + nombre del comercio. */
export function Marca({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HardHat className="size-4" />
      </span>
      <span className="leading-tight">{COMERCIO.nombre}</span>
    </div>
  );
}
