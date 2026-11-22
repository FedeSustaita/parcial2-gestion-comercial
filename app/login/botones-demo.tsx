"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { loginDemoAction } from "@/app/actions/sesion";
import { Button } from "@/components/ui/button";

/**
 * Modo demo: entra como administrador o vendedor de prueba con un clic,
 * sin escribir usuario ni contraseña (pedido del profesor para la corrección).
 */
export function BotonesDemo({
  destino,
  credenciales,
}: {
  destino: string;
  credenciales: { admin: { email: string; password: string }; vendedor: { email: string; password: string } };
}) {
  const router = useRouter();
  const [entrando, setEntrando] = useState<"admin" | "vendedor" | null>(null);

  async function entrar(rol: "admin" | "vendedor") {
    setEntrando(rol);
    const r = await loginDemoAction(rol);
    if (!r.ok) {
      toast.error(r.error.message);
      setEntrando(null);
      return;
    }
    toast.success(`Entraste como ${r.data.nombre} (modo demo).`);
    router.replace(destino);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o entrá en modo demo
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" disabled={entrando !== null} onClick={() => entrar("admin")}>
          <ShieldCheck /> {entrando === "admin" ? "Entrando…" : "Administrador"}
        </Button>
        <Button variant="outline" disabled={entrando !== null} onClick={() => entrar("vendedor")}>
          <UserRound /> {entrando === "vendedor" ? "Entrando…" : "Vendedor"}
        </Button>
      </div>
      <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Usuarios de prueba</p>
        <p>
          Administrador: <span className="font-mono">{credenciales.admin.email}</span> /{" "}
          <span className="font-mono">{credenciales.admin.password}</span>
        </p>
        <p>
          Vendedor: <span className="font-mono">{credenciales.vendedor.email}</span> /{" "}
          <span className="font-mono">{credenciales.vendedor.password}</span>
        </p>
      </div>
    </div>
  );
}
