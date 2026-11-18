import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Página pública dos mapas de SPOTs (sem login): gerada por projects/mapas-spots/motor/publicar-hub.py
  async rewrites() {
    return [{ source: "/spots", destination: "/mapas-spots/index.html" }];
  },
};

export default nextConfig;
