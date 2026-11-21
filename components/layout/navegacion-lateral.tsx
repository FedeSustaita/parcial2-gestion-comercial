"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/db/schema";
import { esActivo, NAVEGACION } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

/** Lista de módulos con el activo resaltado (sección 8). */
export function NavegacionLateral({ rol, onNavegar }: { rol: Rol; onNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAVEGACION.filter((i) => i.roles.includes(rol)).map((item) => {
        const activo = esActivo(pathname, item.href);
        const Icono = item.icono;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavegar}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activo
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icono className={cn("size-4", activo && "text-sidebar-primary")} />
            {item.titulo}
          </Link>
        );
      })}
    </nav>
  );
}
