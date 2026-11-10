// Testes com o runner do próprio Node (node --test), sem dependência nova.
// Resolve o alias "@/..." do tsconfig para src/ e completa a extensão .ts.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      const raiz = ${JSON.stringify(new URL("../src/", import.meta.url).href)};
      export async function resolve(especificador, contexto, proximo) {
        if (especificador.startsWith("@/")) {
          const base = raiz + especificador.slice(2);
          for (const ext of ["", ".ts", ".tsx"]) {
            try { return await proximo(base + ext, contexto); } catch {}
          }
        }
        return proximo(especificador, contexto);
      }
    `),
  import.meta.url
);
