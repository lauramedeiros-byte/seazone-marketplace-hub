"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { parseBloco, dataParaIso } from "@/lib/spot-bloco";
import {
  UploadCloud, FolderOpen, Clapperboard, Paperclip, ExternalLink, CalendarDays,
  ClipboardCheck, TriangleAlert,
} from "lucide-react";

type RoteiroResumo = { id: string; formato: string; status: string };

export type Pasta = {
  id: string;
  geradoEm: string;
  geradoPor: string | null;
  origem: string;
  artefatoUrl: string | null;
  docsUrl: string | null;
  observacao: string | null;
  totalAnexos: number;
  roteiros: RoteiroResumo[];
};

const ROTULO_FORMATO: Record<string, string> = {
  "video-narrado": "narrado",
  "video-apresentadora": "apresentadora",
  estatico: "estático",
};

const CLASSE_STATUS: Record<string, string> = {
  teste: "bg-sz-coral-fundo text-sz-coral border-sz-coral-palido",
  produzido: "bg-sz-azul-palido text-sz-navy-escuro border-sz-azul/20",
  aprovado: "bg-gray-50 text-gray-600 border-gray-200",
};

function dataLonga(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function BriefingSpotClient({
  empreendimento,
  pastasInit,
}: {
  empreendimento: { nome: string; slug: string; cidade: string; estado: string };
  pastasInit: Pasta[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lidos, setLidos] = useState<string[]>([]);
  const [spotDoBloco, setSpotDoBloco] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);
  const vazio = {
    geradoEm: hoje, geradoPor: "", conteudoMd: "", artefatoUrl: "", docsUrl: "", observacao: "", anexos: "",
  };
  const [form, setForm] = useState(vazio);

  /**
   * Uma colagem só resolve a subida inteira: o cabeçalho entre `---` traz data, autor,
   * link do artefato, material e fontes. Sem cabeçalho, o texto vira conteúdo puro e os
   * campos continuam à mão — é o caminho de quem colou de um briefing antigo.
   */
  function colar(texto: string) {
    const lido = parseBloco(texto);
    if (!lido.temCabecalho) {
      setForm((f) => ({ ...f, conteudoMd: texto }));
      setLidos([]);
      setSpotDoBloco(null);
      return;
    }
    const c = lido.campos;
    const achados: string[] = [];
    const data = dataParaIso(c.geradoEm?.valor);
    if (data) achados.push(`data ${c.geradoEm.valor}`);
    if (c.geradoPor?.valor) achados.push(c.geradoPor.valor);
    if (c.roi?.valor) achados.push(`ROI ${c.roi.valor}`);
    if (c.aPartirDe?.valor) achados.push(`a partir de ${c.aPartirDe.valor}`);
    if (lido.links.length) achados.push(`${lido.links.length} link(s) de material`);
    if (lido.fontes.length) achados.push(`${lido.fontes.length} fonte(s)`);

    setForm((f) => ({
      ...f,
      conteudoMd: texto,
      geradoEm: data ?? f.geradoEm,
      geradoPor: c.geradoPor?.valor ?? f.geradoPor,
      artefatoUrl: c.artefatoUrl?.valor ?? "",
      docsUrl: c.docsUrl?.valor ?? "",
      observacao: c.observacao?.valor ?? "",
    }));
    setLidos(achados);
    setSpotDoBloco(c.spot?.valor?.trim() ?? null);
  }

  const spotDiferente = Boolean(spotDoBloco && spotDoBloco !== empreendimento.slug);

  async function subir() {
    setSalvando(true);
    setErro(null);
    try {
      const anexos = form.anexos
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((url) => ({ tipo: "link", url }));

      const res = await fetch("/api/spot-briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: empreendimento.slug, anexos }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível subir.");
      setAberto(false);
      setForm(vazio);
      setLidos([]);
      setSpotDoBloco(null);
      router.refresh();
      router.push(`/briefings/${empreendimento.slug}/${json.runId}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <BackButton href="/briefings" label="Voltar aos empreendimentos" />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-sz-navy">{empreendimento.nome}</h1>
          <p className="text-sm text-gray-500">
            {empreendimento.cidade} - {empreendimento.estado} · {pastasInit.length}{" "}
            {pastasInit.length === 1 ? "briefing gerado" : "briefings gerados"}
          </p>
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UploadCloud className="mr-1.5 h-4 w-4" /> Subir briefing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir briefing do {empreendimento.nome}</DialogTitle>
              <DialogDescription>
                Cole o bloco inteiro que o Claude entregou — o cabeçalho entre <code>---</code> preenche data, autor,
                links e fontes sozinho, e é ele que monta a capa e os números da página.{" "}
                <Link href="/briefings/como-gerar" className="text-sz-azul underline">
                  Ver o formato
                </Link>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label htmlFor="sb-conteudo" className="text-xs font-medium text-gray-700">
                  Bloco do briefing <span className="text-sz-coral">*</span>
                </label>
                <Textarea
                  id="sb-conteudo"
                  rows={12}
                  value={form.conteudoMd}
                  placeholder={"---\ntipo: briefing\nspot: " + empreendimento.slug + "\ngeradoEm: " + hoje + "\nroi: 22,12% | média do empreendimento\n---\n\n## O empreendimento"}
                  onChange={(e) => colar(e.target.value)}
                  className="font-mono text-[12px]"
                />
                {lidos.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-sz-navy">
                    <ClipboardCheck className="h-3.5 w-3.5 text-sz-azul" />
                    Li do bloco: {lidos.join(" · ")}
                  </p>
                )}
                {spotDiferente && (
                  <p className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-sz-coral-palido bg-sz-coral-fundo p-2 text-[11px] text-sz-navy">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sz-coral" />
                    O bloco diz <strong>{spotDoBloco}</strong> e esta pasta é do{" "}
                    <strong>{empreendimento.slug}</strong>. Confira antes de subir — vai salvar aqui de qualquer jeito.
                  </p>
                )}
                {!lidos.length && form.conteudoMd.trim() && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Sem cabeçalho <code>---</code>: sobe como texto puro, e a capa e os números não aparecem.
                  </p>
                )}
              </div>

              <details className="rounded-lg border border-gray-200 p-3" open={!lidos.length}>
                <summary className="cursor-pointer text-xs font-medium text-gray-700">
                  Conferir ou corrigir os campos
                </summary>

                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="sb-data" className="text-xs font-medium text-gray-700">Data de geração</label>
                      <Input id="sb-data" type="date" value={form.geradoEm}
                        onChange={(e) => setForm({ ...form, geradoEm: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="sb-por" className="text-xs font-medium text-gray-700">Quem gerou</label>
                      <Input id="sb-por" value={form.geradoPor} placeholder="seu nome"
                        onChange={(e) => setForm({ ...form, geradoPor: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sb-artefato" className="text-xs font-medium text-gray-700">Link do artefato</label>
                      <Input id="sb-artefato" value={form.artefatoUrl} placeholder="https://claude.ai/artifact/..."
                        onChange={(e) => setForm({ ...form, artefatoUrl: e.target.value })} />
                      <p className="mt-1 text-[11px] text-sz-coral">
                        O artefato fica privado na conta de quem gerou — pode não abrir para os outros.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="sb-docs" className="text-xs font-medium text-gray-700">Link do Google Docs</label>
                      <Input id="sb-docs" value={form.docsUrl} placeholder="https://docs.google.com/..."
                        onChange={(e) => setForm({ ...form, docsUrl: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sb-anexos" className="text-xs font-medium text-gray-700">
                      Imagens e outros links <span className="text-gray-400">(um por linha)</span>
                    </label>
                    <Textarea id="sb-anexos" rows={2} value={form.anexos}
                      placeholder={"https://drive.google.com/...\nhttps://..."}
                      onChange={(e) => setForm({ ...form, anexos: e.target.value })} />
                    <p className="mt-1 text-[11px] text-gray-400">
                      O que veio como <code>link:</code> no bloco já entra sozinho na página — aqui é para o que ficou
                      de fora.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="sb-obs" className="text-xs font-medium text-gray-700">Observação</label>
                    <Input id="sb-obs" value={form.observacao} placeholder="algo que quem ler precisa saber"
                      onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
                  </div>
                </div>
              </details>

              {erro && <p className="text-xs text-sz-coral">{erro}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button onClick={subir} disabled={salvando || !form.conteudoMd.trim()}>
                {salvando ? "Subindo..." : "Criar pasta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pastasInit.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="p-8 text-center">
            <FolderOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Nenhum briefing gerado ainda</p>
            <p className="mt-1 text-xs text-gray-500">
              Gere pela skill no Claude e suba aqui.{" "}
              <Link href="/briefings/como-gerar" className="text-sz-azul underline">
                Ver o passo a passo
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pastasInit.map((p, i) => (
            <Link key={p.id} href={`/briefings/${empreendimento.slug}/${p.id}`}>
              <Card className="transition-colors hover:border-sz-azul hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sz-azul" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-sz-navy">
                          Briefing de {dataLonga(p.geradoEm)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.geradoPor ? `Gerado por ${p.geradoPor}` : "Sem autor registrado"}
                          {p.origem === "skill" && " · pela skill"}
                        </p>
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="rounded-full border border-sz-azul/20 bg-sz-azul-palido px-2 py-0.5 text-[11px] font-semibold text-sz-navy-escuro">
                        mais recente
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clapperboard className="h-3.5 w-3.5" />
                      {p.roteiros.length} {p.roteiros.length === 1 ? "roteiro" : "roteiros"}
                    </span>
                    {p.roteiros.map((r) => (
                      <span
                        key={r.id}
                        className={`rounded border px-1.5 py-0.5 text-[10px] ${
                          CLASSE_STATUS[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {ROTULO_FORMATO[r.formato] ?? r.formato}
                        {r.status === "teste" && " · teste"}
                      </span>
                    ))}
                    {p.totalAnexos > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" />
                        {p.totalAnexos}
                      </span>
                    )}
                    {p.artefatoUrl && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" /> artefato
                      </span>
                    )}
                  </div>

                  {p.observacao && <p className="mt-2 text-xs italic text-gray-600">{p.observacao}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
