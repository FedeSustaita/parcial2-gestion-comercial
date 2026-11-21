import { AppShell } from "@/components/layout/app-shell";
import { requerirUsuario } from "@/lib/auth";

// Layout compartido por todos los módulos: panel lateral + barra superior.
// Segunda barrera de protección: sin usuario válido redirige a /login.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const usuario = await requerirUsuario();
  return <AppShell usuario={usuario}>{children}</AppShell>;
}
