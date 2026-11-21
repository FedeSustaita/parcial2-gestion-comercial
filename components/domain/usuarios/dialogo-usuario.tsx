"use client";

import { useState } from "react";
import { actualizarUsuarioAction, crearUsuarioAction } from "@/app/(app)/usuarios/actions";
import { Campo } from "@/components/comunes/campo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormulario } from "@/hooks/use-formulario";
import { ETIQUETAS } from "@/lib/format";
import { crearUsuarioSchema, editarUsuarioSchema } from "@/schemas/usuarios";
import type { UsuarioPublico } from "@/services/usuarios";

/** RF-U4: alta y edición de usuario (admin). */
export function DialogoUsuario({ usuario, disparador }: { usuario?: UsuarioPublico; disparador: React.ReactNode }) {
  const editando = !!usuario;
  const inicial = () => ({
    nombre: usuario?.nombre ?? "",
    email: usuario?.email ?? "",
    rol: usuario?.rol ?? "vendedor",
    password: "",
  });
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState(inicial);
  const form = useFormulario({
    schema: editando ? editarUsuarioSchema : crearUsuarioSchema,
    accion: (d) => (editando ? actualizarUsuarioAction(usuario!.id, d) : crearUsuarioAction(d)),
    mensajeExito: editando ? "Usuario actualizado." : "Usuario creado.",
    onExito: () => setAbierto(false),
  });

  return (
    <Dialog
      open={abierto}
      onOpenChange={(a) => {
        setAbierto(a);
        if (a) {
          setV(inicial());
          form.limpiar();
        }
      }}
    >
      <DialogTrigger asChild>{disparador}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const { password, ...resto } = v;
            form.enviar(editando ? resto : { ...resto, password });
          }}
        >
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            {!editando && (
              <DialogDescription>Comunicale la contraseña temporal; después la puede cambiar en su perfil.</DialogDescription>
            )}
          </DialogHeader>
          <Campo id="nombre" etiqueta="Nombre" error={form.error("nombre")}>
            <Input id="nombre" value={v.nombre} aria-invalid={!!form.error("nombre") || undefined} onChange={(e) => setV({ ...v, nombre: e.target.value })} />
          </Campo>
          <Campo id="email" etiqueta="Email" error={form.error("email")}>
            <Input id="email" type="email" value={v.email} aria-invalid={!!form.error("email") || undefined} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Campo>
          <Campo id="rol" etiqueta="Rol" error={form.error("rol")}>
            <Select value={v.rol} onValueChange={(r) => setV({ ...v, rol: r as "admin" | "vendedor" })}>
              <SelectTrigger id="rol" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">{ETIQUETAS.rol.vendedor}</SelectItem>
                <SelectItem value="admin">{ETIQUETAS.rol.admin}</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          {!editando && (
            <Campo id="password" etiqueta="Contraseña temporal" error={form.error("password")} ayuda="Mínimo 8 caracteres.">
              <Input
                id="password"
                type="text"
                autoComplete="off"
                value={v.password}
                aria-invalid={!!form.error("password") || undefined}
                onChange={(e) => setV({ ...v, password: e.target.value })}
              />
            </Campo>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.enviando}>
              {form.enviando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
