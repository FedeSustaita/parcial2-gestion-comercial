import { Inline, Stack, Text, Title } from "./primitivas";

/** Encabezado de página: título, descripción y acciones a la derecha. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Inline justify="between" align="end" gap={4}>
      <Stack gap={1}>
        <Title>{title}</Title>
        {description && <Text variant="muted">{description}</Text>}
      </Stack>
      {actions && <Inline gap={2}>{actions}</Inline>}
    </Inline>
  );
}
