import type { NextConfig } from "next";

// Endereço próprio da página pública dos mapas de SPOTs (sem login); o mesmo valor está em src/proxy.ts.
// A página é gerada por projects/mapas-spots/motor/publicar-hub.py em public/mapas-spots/index.html.
const HOST_MAPAS = "mapas.seazone.com.br";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // no endereço dos mapas, a raiz é a página pública (antes da home do hub)
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: HOST_MAPAS }], destination: "/mapas-spots/index.html" },
      ],
      // dentro do hub, a mesma página em /spots
      afterFiles: [{ source: "/spots", destination: "/mapas-spots/index.html" }],
      fallback: [],
    };
  },
};

export default nextConfig;
