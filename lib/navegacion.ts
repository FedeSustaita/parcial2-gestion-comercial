import { LayoutDashboard, Package, ShoppingCart, UserCog, Users, type LucideIcon } from "lucide-react";
import type { Rol } from "@/db/schema";

// Módulos del panel lateral (sección 4). `roles` solo oculta el enlace:
// el permiso real lo verifican las páginas y los servicios.
export type ItemNavegacion = { href: string; titulo: string; icono: LucideIcon; roles: Rol[] };

export const NAVEGACION: ItemNavegacion[] = [
  { href: "/", titulo: "Inicio", icono: LayoutDashboard, roles: ["admin", "vendedor"] },
  { href: "/ventas", titulo: "Ventas", icono: ShoppingCart, roles: ["admin", "vendedor"] },
  { href: "/productos", titulo: "Productos", icono: Package, roles: ["admin", "vendedor"] },
  { href: "/clientes", titulo: "Clientes", icono: Users, roles: ["admin", "vendedor"] },
  { href: "/usuarios", titulo: "Usuarios", icono: UserCog, roles: ["admin"] },
];

export function esActivo(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
