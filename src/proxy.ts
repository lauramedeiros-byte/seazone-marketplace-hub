import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out(.*)",
  "/webhooks(.*)",
  "/api/cron(.*)",
  "/api/agente-disparos(.*)", // agente local; protegido por x-agente-token
  "/api/agente-opps(.*)", // agente das opps da semana; mesmo x-agente-token
  "/spots", // página pública dos mapas de SPOTs (public/mapas-spots/index.html)
  "/api/mapa-spots/publico", // números dos mapas para a página pública (só leitura, guardado 5 min)
]);

// Endereço próprio dos mapas (mesmo valor do next.config.ts): ali só a página pública e a rota
// aberta dos números; qualquer outra rota do hub volta para a página dos mapas.
const HOST_MAPAS = "mapas.seazone.com.br";
const ROTAS_DO_HOST_MAPAS = new Set(["/", "/api/mapa-spots/publico"]);

export default clerkMiddleware(async (auth, request) => {
  const host = (request.headers.get("host") || "").split(":")[0];
  if (host === HOST_MAPAS) {
    if (ROTAS_DO_HOST_MAPAS.has(request.nextUrl.pathname)) return;
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
