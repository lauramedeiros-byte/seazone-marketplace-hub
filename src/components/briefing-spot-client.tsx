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
import { UploadCloud, FolderOpen, Clapperboard, Paperclip, ExternalLink, CalendarDays } from "lucide-react";

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
  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    geradoEm: hoje, geradoPor: "", conteudoMd: "", artefatoUrl: "", docsUrl: "", observacao: "", anexos: "",
  });

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
      setForm({ geradoEm: hoje, geradoPor: "", conteudoMd: "", artefatoUrl: "", docsUrl: "", observacao: "", anexos: "" });
      router.refresh();
      router.push(`/briefings/${empreendimento.slug}/${json.runId}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton href="/briefings" label="Voltar aos empreendimentos" />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{empreendimento.nome}</h1>
          <p className="text-gray-500 text-sm">
            {empreendimento.cidade} - {empreendimento.estado} · {pastasInit.length}{" "}
            {pastasInit.length === 1 ? "briefing gerado" : "briefings gerados"}
          </p>
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UploadCloud className="w-4 h-4 mr-1.5" /> Subir briefing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir briefing do {empreendimento.nome}</DialogTitle>
              <DialogDescription>
                Cria uma pasta nova com a data. Cole o texto que saiu no terminal — é ele que fica salvo e que todo
                mundo consegue ver, mesmo sem ter a skill instalada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
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

              <div>
                <label htmlFor="sb-conteudo" className="text-xs font-medium text-gray-700">
                  Conteúdo do briefing <span className="text-red-500">*</span>
                </label>
                <Textarea id="sb-conteudo" rows={12} value={form.conteudoMd}
                  placeholder="Cole aqui o briefing inteiro que saiu no Claude (markdown)."
                  onChange={(e) => setForm({ ...form, conteudoMd: e.target.value })} />
                <p className="text-[11px] text-gray-400 mt-1">
                  Aceita markdown, inclusive as tabelas de cotas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="sb-artefato" className="text-xs font-medium text-gray-700">Link do artefato</label>
                  <Input id="sb-artefato" value={form.artefatoUrl} placeholder="https://claude.ai/artifact/..."
                    onChange={(e) => setForm({ ...form, artefatoUrl: e.target.value })} />
                  <p className="text-[11px] text-amber-600 mt-1">
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
                  Outros links <span className="text-gray-400">(um por linha)</span>
                </label>
                <Textarea id="sb-anexos" rows={2} value={form.anexos}
                  placeholder={"https://drive.google.com/...\nhttps://..."}
                  onChange={(e) => setForm({ ...form, anexos: e.target.value })} />
              </div>

              <div>
                <label htmlFor="sb-obs" className="text-xs font-medium text-gray-700">Observação</label>
                <Input id="sb-obs" value={form.observacao} placeholder="algo que quem ler precisa saber"
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
              </div>

              {erro && <p className="text-xs text-red-600">{erro}</p>}
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
            <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Nenhum briefing gerado ainda</p>
            <p className="text-xs text-gray-500 mt-1">
              Gere pela skill no Claude e suba aqui.{" "}
              <Link href="/briefings/como-gerar" className="text-blue-600 underline">
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
              <Card className="hover:border-blue-300 hover:shadow-sm transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <CalendarDays className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900">
                          Briefing de {dataLonga(p.geradoEm)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.geradoPor ? `Gerado por ${p.geradoPor}` : "Sem autor registrado"}
                          {p.origem === "skill" && " · pela skill"}
                        </p>
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        mais recente
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clapperboard className="w-3.5 h-3.5" />
                      {p.roteiros.length} {p.roteiros.length === 1 ? "roteiro" : "roteiros"}
                    </span>
                    {p.roteiros.map((r) => (
                      <span
                        key={r.id}
                        className={`px-1.5 py-0.5 rounded border text-[10px] ${
                          r.status === "teste"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : r.status === "produzido"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {ROTULO_FORMATO[r.formato] ?? r.formato}
                        {r.status === "teste" && " · teste"}
                      </span>
                    ))}
                    {p.totalAnexos > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" />
                        {p.totalAnexos}
                      </span>
                    )}
                    {p.artefatoUrl && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" /> artefato
                      </span>
                    )}
                  </div>

                  {p.observacao && <p className="mt-2 text-xs text-gray-600 italic">{p.observacao}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
