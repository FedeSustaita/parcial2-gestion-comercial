"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Paginador de listados. La página vive en la URL (?page=N) para que el
 * listado se pueda recargar y compartir (sección 10.6).
 */
export function Paginador({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const href = (p: number) => {
    const q = new URLSearchParams(params);
    if (p <= 1) q.delete("page");
    else q.set("page", String(p));
    const s = q.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Mostrando {desde}–{hasta} de {total}
      </span>
      {paginas > 1 && (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
          {page > 1 ? (
            <Link href={href(page - 1)}>
              <ChevronLeft /> Anterior
            </Link>
          ) : (
            <span>
              <ChevronLeft /> Anterior
            </span>
          )}
        </Button>
        <span className="tabular-nums text-muted-foreground">
          {page} / {paginas}
        </span>
        <Button variant="outline" size="sm" asChild={page < paginas} disabled={page >= paginas}>
          {page < paginas ? (
            <Link href={href(page + 1)}>
              Siguiente <ChevronRight />
            </Link>
          ) : (
            <span>
              Siguiente <ChevronRight />
            </span>
          )}
        </Button>
      </div>
      )}
    </div>
  );
}
