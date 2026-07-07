"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  Check,
  History,
  Edit2,
  X,
  ExternalLink,
  Clock,
  Users,
  AlertTriangle,
  Video,
  ListChecks,
  MapPin,
  Repeat,
  Radio,
  PenLine,
} from "lucide-react";

interface OppItem {
  id: string;
  nomeEmpreendimento: string;
  localizacao: string | null;
  preco: string | null;
  condicoes: string | null;
  destaque: boolean;
  tipoDestaque: string | null;
  justificativa: string | null;
  textoWhatsapp: string | null;
  textoEmail: string | null;
  observacoes: string | null;
  Disparado: boolean;
  dataDisparo: Date | null;
  comentarioDisparo: string | null;
}

interface OppSemana {
  id: string;
  weekStart: Date;
  metaSemana: number | null;
  observacoes: string | null;
  items: OppItem[];
}

interface Props {
  semanas: OppSemana[];
  passoInicial?: unknown;
}

function Step({ n, children, tone = "dark" }: { n: number; children: ReactNode; tone?: "dark" | "video" }) {
  return (
    <li className="flex gap-3">
      <span
        className={`w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0 ${
          tone === "video" ? "bg-fuchsia-600" : "bg-gray-900"
        }`}
      >
        {n}
      </span>
      <div className="text-sm text-gray-700 leading-relaxed pt-0.5">{children}</div>
    </li>
  );
}

const linkCls = "text-teal-700 font-medium underline underline-offset-2";

// ── Parser do formato rico (blocos separados por --- com emojis) ───────────
function stripEmoji(s: string): string {
  return s.replace(/:[a-z0-9_+\-]+:/gi, " ").replace(/\s+/g, " ").trim();
}

function splitOppBlocks(text: string): string[] {
  // separa o texto antes de cada cabeçalho "Oportunidade —", tolerando ou não os "---"
  return text
    .split(/(?=(?::fire:\s*)?Oportunidade\s*[—–-]\s)/i)
    .map((p) => p.replace(/\n\s*-{3,}\s*\n?/g, "\n").trim())
    .filter((p) => /Oportunidade\s*[—–-]/i.test(p));
}

interface ParsedOpp {
  nome: string;
  preco: string | null;
  localizacao: string | null;
  condicoes: string;
  observacoes: string;
}

function parseOppBlock(raw: string): ParsedOpp | null {
  const original = raw.trim();
  const lines = original.split("\n").map((l) => l.trim()).filter(Boolean);
  let nome = "";
  let preco: string | null = null;
  let localizacao: string | null = null;
  const cond: string[] = [];
  const push = (v: string) => {
    const t = v.trim();
    if (!t || t.length <= 1) return;
    if (/^Unidade\s+\S+$/i.test(t)) return; // a unidade já vai no nome
    if (!cond.includes(t)) cond.push(t);
  };

  for (const line of lines) {
    const clean = stripEmoji(line);
    if (!clean) continue;

    const hdr = clean.match(/Oportunidade\s*[—–-]\s*(.+)/i);
    if (hdr) {
      nome = hdr[1].trim();
      continue;
    }

    const isMoney = /moneybag/i.test(line) || (!preco && /^R\$/.test(clean));
    if (isMoney) {
      const m = clean.match(/R\$\s*[\d.]+(?:,\d{2})?/);
      if (m) preco = m[0].replace(/\s+/g, " ").trim();
      const parts = clean.split("|").map((s) => s.trim());
      for (let i = 1; i < parts.length; i++) push(parts[i]); // condições após o preço (Distrato, Entrada em 6x…)
      continue;
    }

    // linha de localização (cidade/UF)
    if (/round_pushpin/i.test(line) && /\/[A-Za-z]{2}\b/.test(clean) && !localizacao) {
      localizacao = clean;
      continue;
    }

    // demais linhas de benefício: quebra por "|" em itens separados
    for (const part of clean.split("|")) push(part);
  }

  if (!nome) return null;
  return {
    nome: nome.substring(0, 160),
    preco,
    localizacao,
    condicoes: cond.join(" · "),
    observacoes: original,
  };
}

function parseOppsText(text: string): ParsedOpp[] | null {
  const blocks = splitOppBlocks(text);
  if (blocks.length === 0) return null; // não é o formato rico → usar parser antigo (linha a linha)
  return blocks.map(parseOppBlock).filter((b): b is ParsedOpp => b !== null);
}

// ── Conteúdo editável da aba "Passo a passo" ───────────────────────────────
interface PassoSecao {
  titulo: string;
  intro: string;
  passos: string[];
}
interface PassoConteudo {
  principal: PassoSecao & { observacao: string };
  video: PassoSecao;
}

const DEFAULT_PASSO: PassoConteudo = {
  principal: {
    titulo: "Passo a passo das opps",
    intro: "Do pedido ao time de Marketplace até o disparo pela Gaby.",
    passos: [
      "Cobre o time de Marketplace entre quarta e sexta, toda semana, para mandarem as 5 oportunidades.",
      "Suba as oportunidades aqui no artefato + no artefato da Mônica. Um aviso automático é gerado para ela no grupo #comunidade-investidores no Slack, para escolher as 3 da semana.",
      "Enquanto isso, você já pode escolher 2 cotas da semana passada que não foram publicadas pelo marketing — ou esperar a Mônica escolher as da semana vigente e ficar com o restante. No fim da sexta você deve ter 2 cotas escolhidas para a semana seguinte.",
      "Com as 2 cotas escolhidas, acesse a skill /textos-2-top-opps-marketplace. Ela pede os dados do empreendimento e monta 2 opções de WhatsApp e 2 de e-mail. Dê um check e ajuste as frases se alguma ficar ruim.",
      "Com os textos em mãos, peça para a Gaby disparar WhatsApp e e-mail no grupo #entrega_disparos, sinalizando o dia de disparo de cada uma. Não esqueça de enviar as fotos para a Gaby!",
    ],
    observacao:
      "Ao escolher cota da semana passada, confira no Spotômetro → Revendas (https://spotometro.seazone.com.br/) se ela ainda está disponível. Se não estiver, escolha outra (da semana passada ou da semana atual).",
  },
  video: {
    titulo: "Vídeos Narrados da OPP da semana",
    intro: "Processo paralelo. O 1º vídeo (1ª opp) é postado na terça, e a 2ª opp na quinta.",
    passos: [
      "Depois de escolher as opps da semana, monte o briefing para o Designer fazer um vídeo narrado simples da opp.",
      "Para montar o roteiro, acesse o Claude Chat com a skill /[a definir] (nome a definir — em criação).",
      "Forneça os dados do empreendimento e ele vai gerar o roteiro.",
      "Baixe em .docx e confira as cenas/roteiro. (Costuma precisar ajustar as cenas e simplificar o lettering.)",
      "Abra um card no Pipefy pedindo a opp para o designer, respeitando a data de entrega.",
      "Entre na pasta de briefings (pela Home do Hub Marketplace) e suba o briefing no artefato oficial de Marketplace.",
      "Depois de pronto, envie no #social-media-mkt (https://seazone-fund.slack.com/archives/C06BUCUDX1B) para a Thay postar (só no story — ela já sabe qual link colocar). Exemplo de pedido: https://seazone-fund.slack.com/archives/C06BUCUDX1B/p1782826216806829",
    ],
  },
};

function mergePasso(saved: unknown): PassoConteudo {
  const s = (saved ?? {}) as Partial<PassoConteudo>;
  return {
    principal: { ...DEFAULT_PASSO.principal, ...(s.principal ?? {}) },
    video: { ...DEFAULT_PASSO.video, ...(s.video ?? {}) },
  };
}

// Deixa URLs (https://…) clicáveis dentro de um texto livre
function renderComLinks(text: string): ReactNode {
  return text.split(/(https?:\/\/[^\s)]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function OppsClient({ semanas: initial, passoInicial }: Props) {
  const { user } = useUser();
  const [semanas, setSemanas] = useState(initial);
  const [passo, setPasso] = useState<PassoConteudo>(() => mergePasso(passoInicial));
  const [editPasso, setEditPasso] = useState(false);
  const [draftPasso, setDraftPasso] = useState<PassoConteudo>(passo);
  const [savingPasso, setSavingPasso] = useState(false);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [editWhatsapp, setEditWhatsapp] = useState<Record<string, string>>({});
  const [editEmail, setEditEmail] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [addingOpp, setAddingOpp] = useState(false);
  const [bulkOppText, setBulkOppText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingOpp, setEditingOpp] = useState<string | null>(null);
  const [editOppData, setEditOppData] = useState({ nome: "", preco: "", condicoes: "" });
  const [openTextos, setOpenTextos] = useState<string | null>(null);

  const activeSemana = semanas[activeWeekIdx];
  const prevSemana = semanas[activeWeekIdx + 1];

  const formatWeek = (d: Date) => {
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(start.getDate() + 6);
    const opts = { day: "2-digit", month: "short" } as const;
    return `${start.toLocaleDateString("pt-BR", opts)} – ${end.toLocaleDateString("pt-BR", { ...opts, year: "numeric" })}`;
  };

  const goPrev = () => setActiveWeekIdx((i) => Math.max(0, i - 1));
  const goNext = () => setActiveWeekIdx((i) => Math.min(semanas.length - 1, i + 1));

  // ── Grupos da semana ativa ──────────────────────────────────────────────
  // Bloco 1: as opps que subiram nesta semana (não são cópias vindas da semana anterior)
  const oppsDaSemana = (activeSemana?.items ?? []).filter((i) => i.tipoDestaque !== "semana-anterior");
  // Bloco 3: as escolhidas para publicar (destaque)
  const escolhidas = (activeSemana?.items ?? []).filter((i) => i.destaque);
  // Bloco 2: opps da semana passada (também não são cópias)
  const oppsSemanaPassada = (prevSemana?.items ?? []).filter((i) => i.tipoDestaque !== "semana-anterior");
  const podeEscolherMais = escolhidas.length < 2;
  // Nomes já trazidos da semana passada (para marcar como "escolhida" no bloco 2)
  const nomesTrazidos = new Set(
    (activeSemana?.items ?? [])
      .filter((i) => i.tipoDestaque === "semana-anterior")
      .map((i) => i.nomeEmpreendimento)
  );
  // "No ar esta semana" = as escolhidas na semana anterior (que estão sendo publicadas agora)
  const noAr = (prevSemana?.items ?? []).filter((i) => i.destaque);
  // Rótulo da semana de publicação (a semana seguinte à que está sendo montada)
  const nextWeekLabel = activeSemana
    ? (() => {
        const d = new Date(activeSemana.weekStart);
        d.setDate(d.getDate() + 7);
        return formatWeek(d);
      })()
    : "";

  function parseBulkOpp(line: string): { nome: string; preco: string | null; condicoes: string } {
    const texto = line.trim();
    let preco: string | null = null;
    const condicoes: string[] = [];

    const precoMatch = texto.match(/(R\$\s*[\d\.,]+)/);
    if (precoMatch) {
      preco = precoMatch[1].trim();
    }

    const keywords = [
      "ágio zero", "lançamento", "condição de lançamento", "condição lançamento",
      "entrega", "vista mar", "vista lateral", "garden", "garten",
      "parcelamento", "parcelas", "abaixo do mercado", "abaixo de mercado", "abaixo",
      "6x", "10x", "3x", "5x", "8x", "até 3x", "até 6x", "até 8x", "até 10x",
      "aceita", "previsão", "obra", "obras", "distrato", "beira-mar",
      "menor", "maior", "flexível", "flexivel", "flex",
      "checkout", "chekout", "cota mais", "cabana", "faturamento",
      "localização", "localizacao", "certeza", "certeza de parcelamento",
    ];

    const lowerTexto = texto.toLowerCase();
    for (const kw of keywords) {
      if (lowerTexto.includes(kw)) {
        const idx = lowerTexto.indexOf(kw);
        const start = Math.max(0, idx - 10);
        const end = Math.min(texto.length, idx + kw.length + 20);
        let context = texto.substring(start, end).trim();
        context = context.replace(/R\$\s*[\d\.,]+/g, "").trim();
        if (context && context.length > 3) {
          context = context.replace(/[;:\-]\s*$/, "").trim();
          if (!condicoes.includes(context)) {
            condicoes.push(context);
          }
        }
      }
    }

    let nome = texto
      .replace(/R\$\s*[\d\.,]+/g, "")
      .replace(/\s*;\s*/g, " ")
      .replace(/\s*:\s*/g, " - ")
      .replace(/^\s*-\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (nome.length < 3) {
      nome = texto.split(/[;:]/)[0].trim();
    }

    return {
      nome: nome.substring(0, 100),
      preco,
      condicoes: condicoes.join("; "),
    };
  }

  const handleAddBulkOpps = async () => {
    if (!bulkOppText.trim() || !activeSemana) return;
    setAddingOpp(true);
    setBulkError(null);
    setBulkSuccess(null);
    try {
      const errors: string[] = [];
      let parsed: ParsedOpp[] = [];

      const structured = parseOppsText(bulkOppText);
      if (structured && structured.length > 0) {
        // formato rico (blocos com emojis)
        parsed = structured;
      } else {
        // formato antigo: uma opp por linha
        const lines = bulkOppText.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          const { nome, preco, condicoes } = parseBulkOpp(line);
          if (!nome || nome.length < 2) {
            errors.push(`Não consegui entender: "${line.substring(0, 50)}..."`);
            continue;
          }
          parsed.push({ nome, preco, localizacao: null, condicoes, observacoes: "" });
        }
      }

      if (parsed.length === 0) {
        setBulkError(
          errors.length
            ? `Não consegui entender:\n${errors.join("\n")}`
            : "Não consegui identificar nenhuma opp no texto colado."
        );
        return;
      }

      let added = 0;
      for (const p of parsed) {
        const result = await fetch("/api/opps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            semanaId: activeSemana.id,
            nomeEmpreendimento: p.nome.trim(),
            localizacao: p.localizacao,
            preco: p.preco,
            condicoes: p.condicoes || null,
            observacoes: p.observacoes || null,
          }),
        });
        if (result.ok) {
          added++;
        } else {
          const d = await result.json();
          errors.push(`${p.nome}: ${d.error || "erro"}`);
        }
      }

      setBulkOppText("");
      if (added > 0) {
        setBulkSuccess(`${added} opp(s) adicionada(s) com sucesso!`);
        setTimeout(() => window.location.reload(), 1200);
      }
      if (errors.length > 0) {
        setBulkError(`Erros:\n${errors.join("\n")}`);
      }
    } finally {
      setAddingOpp(false);
    }
  };

  const patchItem = (id: string, patch: Partial<OppItem>) => {
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx
          ? { ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }
          : s
      )
    );
  };

  const handleToggleDestaque = async (item: OppItem) => {
    if (!item.destaque && !podeEscolherMais) {
      alert("Máximo de 2 opps escolhidas por semana");
      return;
    }
    setBusyId(item.id);
    try {
      const result = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-destaque", id: item.id }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao atualizar");
        return;
      }
      patchItem(item.id, { destaque: !item.destaque });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleMonica = async (item: OppItem) => {
    setBusyId(item.id);
    try {
      const isMonica = item.tipoDestaque === "monica";
      const result = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-monica", id: item.id }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao atualizar");
        return;
      }
      patchItem(item.id, { tipoDestaque: isMonica ? null : "monica", destaque: isMonica ? item.destaque : false });
    } finally {
      setBusyId(null);
    }
  };

  const handleChoosePrev = async (item: OppItem) => {
    if (!activeSemana) return;
    if (!podeEscolherMais) {
      alert("Máximo de 2 opps escolhidas por semana");
      return;
    }
    setBusyId(item.id);
    try {
      const result = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "choose-prev",
          semanaId: activeSemana.id,
          sourceId: item.id,
        }),
      });
      const data = await result.json();
      if (!result.ok) {
        alert(data.error || "Erro ao escolher");
        return;
      }
      setSemanas((prev) =>
        prev.map((s, i) =>
          i === activeWeekIdx
            ? { ...s, items: [...s.items, { ...data.item, Disparado: false, comentarioDisparo: null }] }
            : s
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveChosen = async (item: OppItem) => {
    setBusyId(item.id);
    try {
      if (item.tipoDestaque === "semana-anterior") {
        // veio da semana passada: era só uma cópia para escolha → apaga
        await fetch("/api/opps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: item.id }),
        });
        setSemanas((prev) =>
          prev.map((s, i) =>
            i === activeWeekIdx ? { ...s, items: s.items.filter((it) => it.id !== item.id) } : s
          )
        );
      } else {
        // opp desta semana: só tira o destaque, mantém na lista
        await fetch("/api/opps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle-destaque", id: item.id }),
        });
        patchItem(item.id, { destaque: false });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateTexto = (id: string, field: "textoWhatsapp" | "textoEmail", value: string) => {
    if (field === "textoWhatsapp") {
      setEditWhatsapp((p) => ({ ...p, [id]: value }));
    } else {
      setEditEmail((p) => ({ ...p, [id]: value }));
    }
  };

  const handleSaveTexto = async (item: OppItem, field: "textoWhatsapp" | "textoEmail") => {
    const value = field === "textoWhatsapp" ? editWhatsapp[item.id] : editEmail[item.id];
    if (value === undefined) return;
    setSaving(item.id + field);
    try {
      await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-texto", id: item.id, field, value }),
      });
      patchItem(item.id, { [field]: value } as Partial<OppItem>);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteOpp = async (item: OppItem) => {
    if (!confirm("Excluir esta oportunidade?")) return;
    await fetch("/api/opps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: item.id }),
    });
    setSemanas((prev) =>
      prev.map((s, i) =>
        i === activeWeekIdx ? { ...s, items: s.items.filter((it) => it.id !== item.id) } : s
      )
    );
  };

  const handleStartEditOpp = (item: OppItem) => {
    setEditingOpp(item.id);
    setEditOppData({
      nome: item.nomeEmpreendimento,
      preco: item.preco || "",
      condicoes: item.condicoes || "",
    });
  };

  const handleSaveEditOpp = async (item: OppItem) => {
    for (const [field, value] of [
      ["nomeEmpreendimento", editOppData.nome],
      ["preco", editOppData.preco],
      ["condicoes", editOppData.condicoes],
    ] as const) {
      await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-texto", id: item.id, field, value }),
      });
    }
    patchItem(item.id, {
      nomeEmpreendimento: editOppData.nome,
      preco: editOppData.preco || null,
      condicoes: editOppData.condicoes || null,
    });
    setEditingOpp(null);
  };

  // ── Passo a passo (editável, salvo no banco) ─────────────────────────────
  const startEditPasso = () => {
    setDraftPasso(JSON.parse(JSON.stringify(passo)) as PassoConteudo);
    setEditPasso(true);
  };
  const setSecao = (sec: "principal" | "video", patch: Partial<PassoConteudo["principal"]>) => {
    setDraftPasso((d) => ({ ...d, [sec]: { ...d[sec], ...patch } }));
  };
  const updatePassoItem = (sec: "principal" | "video", idx: number, val: string) => {
    setDraftPasso((d) => ({
      ...d,
      [sec]: { ...d[sec], passos: d[sec].passos.map((p, i) => (i === idx ? val : p)) },
    }));
  };
  const addPassoItem = (sec: "principal" | "video") => {
    setDraftPasso((d) => ({ ...d, [sec]: { ...d[sec], passos: [...d[sec].passos, ""] } }));
  };
  const removePassoItem = (sec: "principal" | "video", idx: number) => {
    setDraftPasso((d) => ({ ...d, [sec]: { ...d[sec], passos: d[sec].passos.filter((_, i) => i !== idx) } }));
  };
  const savePasso = async () => {
    setSavingPasso(true);
    try {
      const clean: PassoConteudo = {
        principal: { ...draftPasso.principal, passos: draftPasso.principal.passos.map((p) => p.trim()).filter(Boolean) },
        video: { ...draftPasso.video, passos: draftPasso.video.passos.map((p) => p.trim()).filter(Boolean) },
      };
      const res = await fetch("/api/opps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-passo", conteudo: clean }),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || "Erro ao salvar");
        return;
      }
      setPasso(clean);
      setEditPasso(false);
    } finally {
      setSavingPasso(false);
    }
  };

  // Histórico: semanas com opps escolhidas
  const historyData = useMemo(() => {
    return semanas
      .filter((s) => s.items.some((i) => i.destaque))
      .map((s) => ({
        fullWeek: formatWeek(new Date(s.weekStart)),
        selected: s.items.filter((i) => i.destaque).map((i) => i.nomeEmpreendimento),
      }));
  }, [semanas]);

  // ── Sub-linha de metadados de uma opp ────────────────────────────────────
  const OppMeta = ({ item, clamp = true }: { item: OppItem; clamp?: boolean }) => {
    const chips = (item.condicoes || "").split(" · ").map((c) => c.trim()).filter(Boolean);
    const shown = clamp ? chips.slice(0, 5) : chips;
    const extra = chips.length - shown.length;
    return (
      <div className="mt-1 space-y-1.5">
        <div className="flex flex-wrap gap-1.5 items-center">
          {item.preco && (
            <span className="text-[11px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-semibold">{item.preco}</span>
          )}
          {item.localizacao && (
            <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.localizacao}
            </span>
          )}
        </div>
        {shown.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {shown.map((c, i) => (
              <span key={i} className="text-[10.5px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">
                {c}
              </span>
            ))}
            {clamp && extra > 0 && <span className="text-[10.5px] text-gray-400 self-center">+{extra}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Opps da Semana</h1>
        <p className="text-gray-500 text-sm">
          Escolha as opps que vão para publicação e monte os textos de WhatsApp e e-mail.
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1.5 mt-2">
          <Clock className="w-3.5 h-3.5" />
          Você escolhe na sexta — as 5 que sobem esta semana são para publicar na semana seguinte.
        </div>
      </div>

      <Tabs defaultValue="fluxo">
        <TabsList className="mb-4">
          <TabsTrigger value="fluxo">Opps da semana</TabsTrigger>
          <TabsTrigger value="passo">Passo a passo das opps</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo">

      {/* Links úteis (compactos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <a
          href="https://opps-seazone.vercel.app/#marketplace"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2 hover:bg-purple-50 transition-colors"
        >
          <Users className="w-4 h-4 text-purple-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-700 truncate">Opps Mônica</p>
            <p className="text-[10.5px] text-gray-500 truncate">Preencher p/ comunidade</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 shrink-0" />
        </a>
        <a
          href="https://claude.ai/artifacts/latest/63177553-77d0-4911-89d2-01a5114de546"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 hover:bg-blue-50 transition-colors"
        >
          <Repeat className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-700 truncate">Transformar Opps</p>
            <p className="text-[10.5px] text-gray-500 truncate">P/ formato da Mônica</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
        </a>
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
          <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-700 truncate">Montar textos 2 top opps</p>
            <p className="text-[10.5px] text-gray-500 truncate">Skill /textos-2-top-opps-marketplace</p>
          </div>
        </div>
        <a
          href="/opps-textos-monica"
          className="group flex items-center gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/50 px-3 py-2 hover:bg-fuchsia-50 transition-colors"
        >
          <PenLine className="w-4 h-4 text-fuchsia-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-700 truncate">Textos p/ opps escolhidas da Mônica</p>
            <p className="text-[10.5px] text-gray-500 truncate">Passo a passo + prompt</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-fuchsia-500 shrink-0" />
        </a>
      </div>

      {/* Seletor de semana + histórico */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goPrev} disabled={activeWeekIdx === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-gray-800 min-w-[190px] text-center text-sm">
            {activeSemana ? formatWeek(new Date(activeSemana.weekStart)) : "—"}
          </span>
          <Button variant="outline" size="icon" onClick={goNext} disabled={activeWeekIdx >= semanas.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant={showHistory ? "default" : "outline"} size="sm" onClick={() => setShowHistory(!showHistory)}>
          <History className="w-4 h-4" />
          {showHistory ? "Ocultar histórico" : "Ver histórico"}
        </Button>
      </div>

      {/* Histórico */}
      {showHistory && (
        <Card className="mb-6 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de opps escolhidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma opp escolhida ainda</p>
            ) : (
              <div className="space-y-3">
                {historyData.map((entry, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-sm text-gray-700 mb-1">{entry.fullWeek}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.selected.map((name, i) => (
                        <span key={i} className="text-sm text-teal-700 bg-white rounded-lg px-2 py-1 border">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orientação: para qual semana estou escolhendo */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <div className="w-9 h-9 rounded-lg bg-teal-600 text-white grid place-items-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-teal-800">Você está escolhendo as opps da semana que vem</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Toda <strong>sexta</strong> você escolhe <strong>2 opps</strong> para publicar na{" "}
            <strong>semana que vem{nextWeekLabel ? ` (${nextWeekLabel})` : ""}</strong>. Escolha entre as que chegaram hoje e as da semana passada.
          </p>
        </div>
      </div>

      {/* No ar esta semana (as escolhidas na sexta passada) */}
      {noAr.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 border-l-4 border-l-red-500 bg-white p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Radio className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-gray-800">No ar esta semana</span>
            <span className="text-[11px] text-gray-400">
              {activeSemana ? `· ${formatWeek(new Date(activeSemana.weekStart))} ` : ""}· escolhidas na sexta passada
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {noAr.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.nomeEmpreendimento}</p>
                    {item.localizacao && <p className="text-[11px] text-gray-500 truncate">{item.localizacao}</p>}
                  </div>
                  {(item.textoWhatsapp || item.textoEmail) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-teal-700 border-teal-300"
                      onClick={() => setOpenTextos(openTextos === item.id ? null : item.id)}
                    >
                      {openTextos === item.id ? "Ocultar" : "Ver textos"}
                    </Button>
                  )}
                </div>
                {openTextos === item.id && (
                  <div className="mt-2 space-y-2">
                    {item.textoWhatsapp && (
                      <div className="rounded-md border border-green-200 bg-green-50 p-2">
                        <p className="text-[11px] font-medium text-green-700 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </p>
                        <p className="text-[11px] text-gray-700 whitespace-pre-wrap break-words">{renderComLinks(item.textoWhatsapp)}</p>
                      </div>
                    )}
                    {item.textoEmail && (
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
                        <p className="text-[11px] font-medium text-blue-700 mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> E-mail
                        </p>
                        <p className="text-[11px] text-gray-700 whitespace-pre-wrap break-words">{renderComLinks(item.textoEmail)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso: avisar a Thay */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900">
          <strong>Ao escolher as 2, avise a Thay</strong> de quais vão ser — ela pega as imagens estáticas na pasta.
        </p>
      </div>

      {/* Divisor: montar a semana que vem */}
      <div className="flex items-center gap-3 mt-6 mb-1">
        <h2 className="text-base font-bold text-gray-800 whitespace-nowrap">Montar a semana que vem</h2>
        <div className="h-px bg-gray-200 flex-1" />
      </div>
      <p className="text-[11px] text-gray-500 mb-3">
        <strong className="text-gray-600">1.</strong> as 5 chegam nesta sexta <span className="text-gray-300">→</span>{" "}
        <strong className="text-gray-600">2.</strong> Mônica pega 3 <span className="text-gray-300">→</span>{" "}
        <strong className="text-gray-600">3.</strong> você escolhe 2 entre as que sobraram e as da semana passada
      </p>

      {/* ── BLOCO 1: Opps desta sexta ─────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Chegaram nesta sexta
                <Badge variant="secondary">{oppsDaSemana.length} do Marketplace</Badge>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Cole as 5 opps e marque as <strong>3 da Mônica</strong> (ela publica na semana seguinte). As <strong>2 que sobrarem</strong> ficam disponíveis para você escolher.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Colar em lote */}
          {bulkError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 whitespace-pre-wrap">{bulkError}</p>
            </div>
          )}
          {bulkSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{bulkSuccess}</p>
            </div>
          )}
          <Textarea
            placeholder={`Cole aqui as opps do Marketplace (pode colar as 5 de uma vez, separadas por ---).\nEu leio automaticamente o nome do empreendimento, o valor e os benefícios de cada uma.`}
            value={bulkOppText}
            onChange={(e) => {
              setBulkOppText(e.target.value);
              setBulkError(null);
              setBulkSuccess(null);
            }}
            rows={6}
            className="text-sm font-mono"
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleAddBulkOpps} disabled={addingOpp || !bulkOppText.trim()}>
              <Plus className="w-4 h-4" />
              {addingOpp ? "Adicionando..." : "Adicionar opps"}
            </Button>
          </div>

          {/* Legenda */}
          {oppsDaSemana.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-violet-300" /> Mônica (posta semana seguinte)</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-gray-300 bg-white" /> Disponível p/ você</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-teal-600" /> Escolhida</span>
            </div>
          )}

          {/* Lista das opps desta semana */}
          <div className="space-y-2 mt-2">
            {oppsDaSemana.map((item) => {
              const isMonica = item.tipoDestaque === "monica";
              const isChosen = item.destaque;
              const isEditing = editingOpp === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    isChosen
                      ? "border-teal-300 bg-teal-50"
                      : isMonica
                      ? "border-violet-200 bg-violet-50/40 opacity-70"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editOppData.nome} onChange={(e) => setEditOppData({ ...editOppData, nome: e.target.value })} placeholder="Nome" className="text-sm" />
                      <div className="flex gap-2">
                        <Input value={editOppData.preco} onChange={(e) => setEditOppData({ ...editOppData, preco: e.target.value })} placeholder="Preço" className="text-sm" />
                        <Input value={editOppData.condicoes} onChange={(e) => setEditOppData({ ...editOppData, condicoes: e.target.value })} placeholder="Condições" className="text-sm" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingOpp(null)}>Cancelar</Button>
                        <Button size="sm" onClick={() => handleSaveEditOpp(item)}>Salvar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.nomeEmpreendimento}</p>
                        <OppMeta item={item} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isChosen ? (
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => handleRemoveChosen(item)} disabled={busyId === item.id}>
                            <Check className="w-4 h-4" /> Escolhida
                          </Button>
                        ) : isMonica ? (
                          <>
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Mônica
                            </Badge>
                            <Button size="sm" variant="ghost" className="text-gray-400 text-xs" onClick={() => handleToggleMonica(item)} disabled={busyId === item.id}>
                              desfazer
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-violet-600 border-violet-200" onClick={() => handleToggleMonica(item)} disabled={busyId === item.id}>
                              Mônica
                            </Button>
                            {podeEscolherMais && (
                              <Button size="sm" variant="outline" className="text-teal-700 border-teal-300" onClick={() => handleToggleDestaque(item)} disabled={busyId === item.id}>
                                Escolher
                              </Button>
                            )}
                          </>
                        )}
                        {!isChosen && (
                          <>
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-blue-600 h-8 w-8" onClick={() => handleStartEditOpp(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 h-8 w-8" onClick={() => handleDeleteOpp(item)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {oppsDaSemana.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Cole acima as 5 opps recebidas do Marketplace.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 2: Opps da semana passada ───────────────────────────────── */}
      {oppsSemanaPassada.length > 0 && (
        <Card className="mb-4 border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Da semana passada
                  <Badge variant="secondary">{formatWeek(new Date(prevSemana!.weekStart))}</Badge>
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">Opps que não foram publicadas — você também pode escolher entre estas.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {oppsSemanaPassada.map((item) => {
                const jaTrazida = nomesTrazidos.has(item.nomeEmpreendimento);
                return (
                  <div key={item.id} className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${jaTrazida ? "border-teal-300 bg-teal-50" : "border-gray-200 bg-white"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.nomeEmpreendimento}</p>
                      <OppMeta item={item} />
                    </div>
                    {jaTrazida ? (
                      <Badge className="bg-teal-600 text-white flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Escolhida
                      </Badge>
                    ) : (
                      podeEscolherMais && (
                        <Button size="sm" variant="outline" className="text-teal-700 border-teal-300 shrink-0" onClick={() => handleChoosePrev(item)} disabled={busyId === item.id}>
                          Escolher
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── BLOCO 3: Escolhidas para publicar ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Suas escolhidas
                <Badge variant={escolhidas.length === 2 ? "success" : "secondary"}>{escolhidas.length}/2</Badge>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Vão ao ar na <strong>semana que vem{nextWeekLabel ? ` (${nextWeekLabel})` : ""}</strong>: em social a semana toda + WhatsApp e e-mail. Cole um link ou digite o texto — tudo é salvo.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {escolhidas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhuma escolhida ainda. Use "Escolher" nas opps acima (as que chegaram nesta sexta ou as da semana passada).
            </p>
          ) : (
            <div className="space-y-4">
              {escolhidas.map((item) => {
                const daSemanaPassada = item.tipoDestaque === "semana-anterior";
                return (
                  <div key={item.id} className="rounded-xl border border-teal-200 border-l-4 border-l-teal-600 p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{item.nomeEmpreendimento}</p>
                        <span className={`inline-block mt-1 text-[11px] font-medium rounded-full px-2 py-0.5 border ${daSemanaPassada ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
                          {daSemanaPassada ? "da semana passada" : "chegou nesta sexta"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => handleRemoveChosen(item)} disabled={busyId === item.id}>
                        <X className="w-4 h-4" /> Remover
                      </Button>
                    </div>

                    {/* O que essa opp oferece */}
                    {(item.preco || item.condicoes || item.localizacao) && (
                      <div className="mb-3">
                        <OppMeta item={item} clamp={false} />
                      </div>
                    )}
                    {item.observacoes && (
                      <details className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <summary className="text-xs font-medium text-gray-600 cursor-pointer select-none">Ver texto completo da opp</summary>
                        <p className="mt-2 text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed">{item.observacoes}</p>
                      </details>
                    )}

                    {/* WhatsApp */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-green-700 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> WhatsApp
                        </label>
                        <Button size="sm" variant="outline" onClick={() => handleSaveTexto(item, "textoWhatsapp")} disabled={saving === item.id + "textoWhatsapp"} className="text-green-700 border-green-300">
                          Salvar
                        </Button>
                      </div>
                      <Textarea
                        value={editWhatsapp[item.id] !== undefined ? editWhatsapp[item.id] : item.textoWhatsapp ?? ""}
                        onChange={(e) => handleUpdateTexto(item.id, "textoWhatsapp", e.target.value)}
                        placeholder="Cole um link com o conteúdo ou digite o texto do WhatsApp…"
                        rows={3}
                        className="text-sm bg-white"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-blue-700 flex items-center gap-1">
                          <Mail className="w-4 h-4" /> E-mail
                        </label>
                        <Button size="sm" variant="outline" onClick={() => handleSaveTexto(item, "textoEmail")} disabled={saving === item.id + "textoEmail"} className="text-blue-700 border-blue-300">
                          Salvar
                        </Button>
                      </div>
                      <Textarea
                        value={editEmail[item.id] !== undefined ? editEmail[item.id] : item.textoEmail ?? ""}
                        onChange={(e) => handleUpdateTexto(item.id, "textoEmail", e.target.value)}
                        placeholder="Cole um link com o conteúdo ou digite o texto do e-mail…"
                        rows={3}
                        className="text-sm bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* ── ABA: Passo a passo ──────────────────────────────────────────── */}
        <TabsContent value="passo">
          {/* Barra de edição */}
          <div className="flex justify-end mb-3">
            {editPasso ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditPasso(false)} disabled={savingPasso}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={savePasso} disabled={savingPasso}>
                  <Check className="w-4 h-4" />
                  {savingPasso ? "Salvando..." : "Salvar tudo"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditPasso}>
                <Edit2 className="w-4 h-4" />
                Editar passo a passo
              </Button>
            )}
          </div>

          {editPasso ? (
            /* ── MODO EDIÇÃO ── */
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-teal-600" /> Processo principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Título</label>
                    <Input value={draftPasso.principal.titulo} onChange={(e) => setSecao("principal", { titulo: e.target.value })} className="text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Descrição</label>
                    <Input value={draftPasso.principal.intro} onChange={(e) => setSecao("principal", { intro: e.target.value })} className="text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Passos</label>
                    <div className="space-y-2 mt-1">
                      {draftPasso.principal.passos.map((p, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="mt-2 text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                          <Textarea value={p} onChange={(e) => updatePassoItem("principal", i, e.target.value)} rows={2} className="text-sm" />
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 h-8 w-8 shrink-0" onClick={() => removePassoItem("principal", i)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => addPassoItem("principal")}>
                      <Plus className="w-4 h-4" /> Adicionar passo
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Observação (aviso destacado)</label>
                    <Textarea value={draftPasso.principal.observacao} onChange={(e) => setSecao("principal", { observacao: e.target.value })} rows={3} className="text-sm mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-fuchsia-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="w-4 h-4 text-fuchsia-600" /> Vídeos Narrados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Título</label>
                    <Input value={draftPasso.video.titulo} onChange={(e) => setSecao("video", { titulo: e.target.value })} className="text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Descrição</label>
                    <Input value={draftPasso.video.intro} onChange={(e) => setSecao("video", { intro: e.target.value })} className="text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Passos</label>
                    <div className="space-y-2 mt-1">
                      {draftPasso.video.passos.map((p, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="mt-2 text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                          <Textarea value={p} onChange={(e) => updatePassoItem("video", i, e.target.value)} rows={2} className="text-sm" />
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 h-8 w-8 shrink-0" onClick={() => removePassoItem("video", i)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => addPassoItem("video")}>
                      <Plus className="w-4 h-4" /> Adicionar passo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-gray-400">
                Dica: cole URLs completas (https://…) no texto — elas viram links automaticamente na visualização.
              </p>
            </div>
          ) : (
            /* ── MODO LEITURA ── */
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-teal-600" />
                    {passo.principal.titulo}
                  </CardTitle>
                  {passo.principal.intro && <p className="text-xs text-gray-500 mt-1">{passo.principal.intro}</p>}
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {passo.principal.passos.map((p, i) => (
                      <Step key={i} n={i + 1}>{renderComLinks(p)}</Step>
                    ))}
                  </ol>
                  {passo.principal.observacao && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-900">{renderComLinks(passo.principal.observacao)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4 border-fuchsia-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="w-4 h-4 text-fuchsia-600" />
                    {passo.video.titulo}
                  </CardTitle>
                  {passo.video.intro && <p className="text-xs text-gray-500 mt-1">{passo.video.intro}</p>}
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {passo.video.passos.map((p, i) => (
                      <Step key={i} n={i + 1} tone="video">{renderComLinks(p)}</Step>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
