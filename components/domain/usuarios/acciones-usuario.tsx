"use client";

import { KeyRound, Pencil, Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { actualizarUsuarioAction, restablecerPasswordAction } from "@/app/(app)/usuarios/actions";
import { Confirmar } from "@/components/comunes/confirmar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UsuarioPublico } from "@/services/usuarios";
import { DialogoUsuario } from "./dialogo-usuario";

export function AccionesUsuario({ usuario, esYo }: { usuario: UsuarioPublico; esYo: boolean }) {
  const [temporal, setTemporal] = useState<string | null>(null);

  async function cambiarEstado() {
    const r = await actualizarUsuarioAction(usuario.id, { activo: !usuario.activo });
    if (r.ok) toast.success(usuario.activo ? "Usuario desactivado." : "Usuario activado.");
    else toast.error(r.error.message);
  }

  async function restablecer() {
    const r = await restablecerPasswordAction(usuario.id);
    if (r.ok) setTemporal(r.data.passwordTemporal);
    else toast.error(r.error.message);
  }

  return (
    <div className="flex justify-end gap-1">
      <DialogoUsuario
        usuario={usuario}
        disparador={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${usuario.nombre}`}>
            <Pencil />
          </Button>
        }
      />
      <Confirmar
        titulo={`¿Restablecer la contraseña de ${usuario.nombre}?`}
        descripcion="Se genera una contraseña temporal nueva y la actual deja de funcionar."
        textoConfirmar="Restablecer"
        destructivo={false}
        onConfirmar={restablecer}
        disparador={
          <Button variant="ghost" size="icon-sm" aria-label="Restablecer contraseña">
            <KeyRound />
          </Button>
        }
      />
      {!esYo && (
        <Confirmar
          titulo={usuario.activo ? `¿Desactivar a ${usuario.nombre}?` : `¿Activar a ${usuario.nombre}?`}
          descripcion={usuario.activo ? "No va a poder iniciar sesión. Su historial se conserva." : undefined}
          textoConfirmar={usuario.activo ? "Desactivar" : "Activar"}
          destructivo={usuario.activo}
          onConfirmar={cambiarEstado}
          disparador={
            <Button variant="ghost" size="icon-sm" aria-label={usuario.activo ? "Desactivar" : "Activar"}>
              <Power className={usuario.activo ? "text-destructive" : "text-emerald-600"} />
            </Button>
          }
        />
      )}

      {/* RF-U5: la contraseña temporal se muestra una sola vez. */}
      <Dialog open={temporal !== null} onOpenChange={(a) => !a && setTemporal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Contraseña temporal</DialogTitle>
            <DialogDescription>Copiala ahora: no se vuelve a mostrar.</DialogDescription>
          </DialogHeader>
          <code className="rounded-md bg-muted px-3 py-2 text-center font-mono text-lg tracking-wider select-all">{temporal}</code>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(temporal ?? "");
                toast.success("Copiada al portapapeles.");
              }}
            >
              Copiar
            </Button>
            <Button onClick={() => setTemporal(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
