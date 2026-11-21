import { PestanasRuta } from "@/components/comunes/pestanas";

// «Existencias» y «Categorías» quedan como pestañas dentro de Productos (sección 4).
export function PestanasProductos() {
  return (
    <PestanasRuta
      items={[
        { href: "/productos", titulo: "Catálogo" },
        { href: "/productos/existencias", titulo: "Existencias" },
        { href: "/productos/categorias", titulo: "Categorías" },
      ]}
    />
  );
}
