import { NuevaVenta } from "@/components/domain/ventas/nueva-venta";
import { PageHeader } from "@/components/layout/page-header";
import { requerirUsuario } from "@/lib/auth";
import { proximoNumero } from "@/services/facturas";

// RF-V1: pantalla de Nueva venta (comprador, ítems y forma de pago).
export default async function NuevaVentaPage() {
  const usuario = await requerirUsuario();
  const { numeroFormateado } = await proximoNumero(usuario);
  return (
    <>
      <PageHeader title="Nueva venta" description="Comprador, productos y forma de pago" />
      <NuevaVenta proximoNumero={numeroFormateado} />
    </>
  );
}
