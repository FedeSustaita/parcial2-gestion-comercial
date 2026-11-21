import { PestanasRuta } from "@/components/comunes/pestanas";

export function PestanasClientes() {
  return (
    <PestanasRuta
      items={[
        { href: "/clientes", titulo: "Listado" },
        { href: "/clientes/saldos", titulo: "Saldos" },
      ]}
    />
  );
}
