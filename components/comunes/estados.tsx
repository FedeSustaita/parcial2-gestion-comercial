import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Stack, Text, Title } from "@/components/layout/primitivas";

// Estados de un listado (sección 8): carga, vacío y error. Se resuelven una
// sola vez y los usan todas las pantallas.

/** Esqueleto de tabla mientras carga. */
export function EstadoCarga({ filas = 6 }: { filas?: number }) {
  return (
    <Stack gap={2} aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full opacity-70" />
      ))}
    </Stack>
  );
}

export function EstadoVacio({
  titulo = "No hay datos para mostrar",
  descripcion,
  accion,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <Stack gap={3} className="items-center rounded-lg border border-dashed px-6 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <Stack gap={1} className="items-center">
        <Title level={3}>{titulo}</Title>
        {descripcion && <Text variant="muted">{descripcion}</Text>}
      </Stack>
      {accion}
    </Stack>
  );
}

export function EstadoError({
  titulo = "No se pudo cargar la información",
  descripcion = "Ocurrió un error inesperado. Intentá de nuevo en unos segundos.",
  accion,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <Stack
      gap={3}
      role="alert"
      className="items-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <AlertTriangle className="size-8 text-destructive" />
      <Stack gap={1} className="items-center">
        <Title level={3}>{titulo}</Title>
        <Text variant="muted">{descripcion}</Text>
      </Stack>
      {accion}
    </Stack>
  );
}
