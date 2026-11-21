import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components desactivado: todas las pantallas dependen de la sesión
  // (cookie) y de datos que cambian en cada operación (stock, saldos), así
  // que se renderizan dinámicamente en cada pedido.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
