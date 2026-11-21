import type { UsuarioSesion } from "@/services/auth";
import { BarraSuperior } from "./barra-superior";
import { Marca } from "./marca";
import { NavegacionLateral } from "./navegacion-lateral";

/**
 * Estructura general del sistema (sección 4): panel lateral fijo con los
 * módulos y barra superior con el usuario. La usa app/(app)/layout.tsx.
 */
export function AppShell({ usuario, children }: { usuario: UsuarioSesion; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r bg-sidebar p-4 md:flex print:hidden">
        <Marca className="px-1 pt-1" />
        <NavegacionLateral rol={usuario.rol} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:pl-60 print:pl-0">
        <BarraSuperior usuario={usuario} />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
