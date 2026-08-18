import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const PAGINA = "/artefatos-de-consulta/criativos-que-funcionaram";

// Campos editáveis de um registro de criativo
const REGISTRO_FIELDS = [
  "titulo",
  "links",
  "imagem",
  "idAnuncio",
  "valorInvestido",
  "mql",
  "sql",
  "opp",
  "won",
  "custoPorWon",
] as const;

// Normaliza número (aceita "1.234,56", vírgula decimal, vazio → null)
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function int(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function normalizeRegistroPatch(rest: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const k of REGISTRO_FIELDS) {
    if (!(k in rest)) continue;
    const val = rest[k];
    switch (k) {
      case "valorInvestido":
      case "custoPorWon":
        patch[k] = num(val);
        break;
      case "mql":
      case "sql":
      case "opp":
      case "won":
        patch[k] = int(val);
        break;
      case "links":
        patch[k] = Array.isArray(val)
          ? val.map((s) => String(s).trim()).filter(Boolean)
          : [];
        break;
      case "titulo":
      case "idAnuncio":
        patch[k] = val ? String(val) : null;
        break;
      case "imagem":
        patch[k] = val ? String(val) : null;
        break;
      default:
        patch[k] = val;
    }
  }
  return patch;
}

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      // ── Pastas (empreendimentos) ─────────────────────────────────────────
      case "create-pasta": {
        const ordem = await db.criativoPastaEmp.count();
        const pasta = await db.criativoPastaEmp.create({
          data: { nome: data.nome?.trim() || "Novo empreendimento", ordem },
        });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, pasta });
      }

      case "update-pasta": {
        const { id, nome } = data;
        const pasta = await db.criativoPastaEmp.update({
          where: { id },
          data: { ...(nome !== undefined ? { nome: nome.trim() } : {}) },
        });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, pasta });
      }

      case "delete-pasta": {
        await db.criativoPastaEmp.delete({ where: { id: data.id } });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true });
      }

      // ── Registros (criativos) ────────────────────────────────────────────
      case "create-registro": {
        const { pastaId, ...rest } = data;
        if (!pastaId) {
          return NextResponse.json({ error: "pastaId obrigatório" }, { status: 400 });
        }
        const ordem = await db.criativoRegistro.count({ where: { pastaId } });
        const patch = normalizeRegistroPatch(rest);
        const registro = await db.criativoRegistro.create({
          data: {
            pastaId,
            ordem,
            links: [],
            ...patch,
          },
        });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, registro });
      }

      case "update-registro": {
        const { id, ...rest } = data;
        const patch = normalizeRegistroPatch(rest);
        const registro = await db.criativoRegistro.update({ where: { id }, data: patch });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true, registro });
      }

      case "delete-registro": {
        await db.criativoRegistro.delete({ where: { id: data.id } });
        revalidatePath(PAGINA);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na API criativos-passado:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
