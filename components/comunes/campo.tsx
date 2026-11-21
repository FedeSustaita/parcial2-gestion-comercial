import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Campo con etiqueta y error junto al campo (sección 8). El control va como
 * hijo; `id` conecta la etiqueta y el mensaje de error para accesibilidad.
 */
export function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  className,
  children,
}: {
  id: string;
  etiqueta: React.ReactNode;
  error?: string;
  ayuda?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} data-invalid={error ? "" : undefined}>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>
      )}
    </div>
  );
}
