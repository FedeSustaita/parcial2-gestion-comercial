import { EstadoCarga } from "@/components/comunes/estados";
import { Stack } from "@/components/layout/primitivas";
import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga común a todas las pantallas del sistema.
export default function Cargando() {
  return (
    <Stack gap={6}>
      <Skeleton className="h-8 w-56" />
      <EstadoCarga />
    </Stack>
  );
}
