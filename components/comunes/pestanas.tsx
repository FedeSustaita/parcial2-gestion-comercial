"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Pestañas que navegan entre rutas (p. ej. Catálogo · Existencias · Categorías). */
export function PestanasRuta({ items }: { items: { href: string; titulo: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {items.map((i) => {
        const activo = pathname === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              activo ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {i.titulo}
          </Link>
        );
      })}
    </nav>
  );
}
