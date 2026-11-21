import { Marca } from "@/components/layout/marca";
import { Stack, Text } from "@/components/layout/primitivas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioLogin } from "./formulario-login";

// /login: única página pública, fuera del layout con panel lateral (sección 4).
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { desde } = await searchParams;
  const destino = typeof desde === "string" && desde.startsWith("/") && !desde.startsWith("//") ? desde : "/";

  return (
    <Stack gap={6} className="min-h-screen items-center justify-center bg-muted/40 p-4">
      <Marca className="text-lg" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresá con tu email y contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioLogin destino={destino} />
        </CardContent>
      </Card>
      <Text variant="small">Sistema de gestión comercial · uso interno</Text>
    </Stack>
  );
}
