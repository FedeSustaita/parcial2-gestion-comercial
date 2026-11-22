import { cn } from "@/lib/utils";

// Primitivas de maquetación (sección 10.6). Las páginas se arman con estas
// piezas + shadcn/ui + componentes del dominio, sin etiquetas HTML sueltas.

type Props = React.ComponentProps<"div">;

const GAP = { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8" } as const;
type Gap = keyof typeof GAP;

/** Apila hijos en columna. */
export function Stack({ gap = 4, className, ...props }: Props & { gap?: Gap }) {
  return <div className={cn("flex flex-col", GAP[gap], className)} {...props} />;
}

/** Alinea hijos en fila (con salto de línea en pantallas chicas). */
export function Inline({
  gap = 2,
  align = "center",
  justify = "start",
  wrap = true,
  className,
  ...props
}: Props & {
  gap?: Gap;
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "between" | "end" | "center";
  wrap?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex",
        GAP[gap],
        wrap && "flex-wrap",
        { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline" }[align],
        { start: "justify-start", between: "justify-between", end: "justify-end", center: "justify-center" }[justify],
        className,
      )}
      {...props}
    />
  );
}

/** Grilla adaptable: 1 columna en móvil y `cols` desde pantallas medianas. */
export function Grid({ cols = 2, gap = 4, className, ...props }: Props & { cols?: 2 | 3 | 4; gap?: Gap }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1",
        { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols],
        GAP[gap],
        className,
      )}
      {...props}
    />
  );
}

/** Texto de párrafo. */
export function Text({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"p"> & { variant?: "default" | "muted" | "small" | "error" | "strong" }) {
  return (
    <p
      className={cn(
        {
          default: "text-sm",
          muted: "text-sm text-muted-foreground",
          small: "text-xs text-muted-foreground",
          error: "text-sm text-destructive",
          strong: "text-sm font-medium",
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Títulos con tamaños consistentes en todo el sistema. */
export function Title({
  level = 1,
  className,
  ...props
}: React.ComponentProps<"h1"> & { level?: 1 | 2 | 3 }) {
  const Tag = (`h${level}` as "h1" | "h2" | "h3");
  return (
    <Tag
      className={cn(
        { 1: "text-2xl font-semibold tracking-tight", 2: "text-lg font-semibold", 3: "text-base font-medium" }[level],
        className,
      )}
      {...props}
    />
  );
}

/** Texto en línea (dentro de una celda o un renglón). */
export function TextoEnLinea({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "strong" | "muted" | "small" }) {
  return (
    <span
      className={cn(
        { default: "", strong: "font-medium", muted: "text-muted-foreground", small: "text-xs text-muted-foreground" }[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Texto en línea con formato de número (alineación tabular). */
export function Num({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("tabular-nums", className)} {...props} />;
}
