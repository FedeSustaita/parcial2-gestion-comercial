import { Button } from "@/components/ui/button";

// Página temporal de la Etapa 0. En la Etapa 1 se reemplaza por el tablero
// dentro del layout con panel lateral.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Gestión comercial</h1>
      <p className="text-muted-foreground">Proyecto inicializado correctamente.</p>
      <Button>shadcn/ui funcionando</Button>
    </main>
  );
}
