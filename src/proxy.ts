import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, request) => {
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
