import { InsigniaRol } from "@/components/comunes/insignias";
import { PageHeader } from "@/components/layout/page-header";
import { Grid, Inline, Stack, Text } from "@/components/layout/primitivas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth";
import { FormularioPassword } from "./formulario-password";

// /perfil: datos del usuario y cambio de contraseña (RF-U5).
export default async function PerfilPage() {
  const usuario = await requerirUsuario();
  return (
    <>
      <PageHeader title="Mi perfil" description="Tus datos y tu contraseña" />
      <Grid cols={2} className="items-start">
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap={3}>
              <Stack gap={0}>
                <Text variant="small">Nombre</Text>
                <Text variant="strong">{usuario.nombre}</Text>
              </Stack>
              <Stack gap={0}>
                <Text variant="small">Email</Text>
                <Text variant="strong">{usuario.email}</Text>
              </Stack>
              <Inline>
                <Text variant="small">Rol</Text>
                <InsigniaRol rol={usuario.rol} />
              </Inline>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>Mínimo 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioPassword />
          </CardContent>
        </Card>
      </Grid>
    </>
  );
}
