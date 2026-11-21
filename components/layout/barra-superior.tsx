"use client";

import { LogOut, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/app/actions/sesion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ETIQUETAS } from "@/lib/format";
import type { UsuarioSesion } from "@/services/auth";
import { Marca } from "./marca";
import { NavegacionLateral } from "./navegacion-lateral";

/** Barra superior: menú en móvil, usuario conectado y botón de salir. */
export function BarraSuperior({ usuario }: { usuario: UsuarioSesion }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 print:hidden items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      {/* En pantallas chicas el panel lateral se colapsa en este menú (sección 8). */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-4">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle asChild>
              <Marca />
            </SheetTitle>
          </SheetHeader>
          <NavegacionLateral rol={usuario.rol} onNavegar={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-4" />
            </span>
            <span className="hidden text-sm font-medium sm:inline">{usuario.nombre}</span>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {ETIQUETAS.rol[usuario.rol]}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span>{usuario.nombre}</span>
            <span className="text-xs font-normal text-muted-foreground">{usuario.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/perfil">
              <UserRound /> Mi perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => logoutAction()}>
            <LogOut /> Salir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
