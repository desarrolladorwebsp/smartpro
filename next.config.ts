import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "169.254.15.227"],
  // Keep the MariaDB driver un-bundled; Turbopack bundling breaks its connection pooling.
  serverExternalPackages: ["mariadb", "@prisma/adapter-mariadb", "mercadopago", "pdfkit"],
  async redirects() {
    return [
      {
        source: "/dashboard/compras",
        destination: "/dashboard/ventas",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
