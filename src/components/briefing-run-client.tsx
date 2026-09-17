"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Md } from "@/components/md";
import { UploadCloud, ExternalLink, AlertTriangle, Clapperboard } from "lucide-react";

type Anexo = { id: string; tipo: string; titulo: string | null; url: string };

export type RoteiroCompleto = {
  id: string; codigo: string; formato: string; status: string;
  duracao: string | null; monica: boolean; estrutura: string | null;
  oQueMuda: string | null; derivadoDe: string | null; conteudoMd: string; anexos: Anexo[];
};

const ROTULO_FORMATO: Record<string, string> = {
  "video-narrado": "Vídeo narrado",
  "video-apresentadora": "Vídeo apresentadora",
  estatico: "Criativo estático",
};

function dataLonga(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function BriefingRunClient({
  slug, ehMaisRecente, empreendimento, run, roteirosInit,
}: {
  slug: string;
  ehMaisRecente: boolean;
  empreendimento: { nome: string; cidade: string; estado: string };
  run: {
    id: string; geradoEm: string; geradoPor: string | null; origem: string; conteudoMd: string;
    artefatoUrl: string | null; docsUrl: string | null; observacao: string | null; anexos: Anexo[];
  };
  roteirosInit: RoteiroCompleto[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    formato: "video-narrado", status: "teste", codigo: "", duracao: "", monica: false,
    estrutura: "", oQueMuda: "", derivadoDe: "", conteudoMd: "", anexos: "",
  });

  async function subir() {
    setSalvando(true);
    setErro(null);
    try {
      const anexos = form.anexos.split("\n").map((l) => l.trim()).filter(Boolean)
        .map((url) => ({ tipo: "link", url }));
      const res = await fetch("/api/spot-roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, briefingRunId: run.id, anexos }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível subir.");
      setAberto(false);
      setForm({ formato: "video-narrado", status: "teste", codigo: "", duracao: "", monica: false,
        estrutura: "", oQueMuda: "", derivadoDe: "", conteudoMd: "", anexos: "" });
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton href={`/briefings/${slug}`} label={`Voltar ao ${empreendimento.nome}`} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{empreendimento.nome} · {empreendimento.cidade} - {empreendimento.estado}</p>
          <h1 className="text-2xl font-bold text-gray-900">Briefing de {dataLonga(run.geradoEm)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {run.geradoPor ? `Gerado por ${run.geradoPor}` : "Sem autor registrado"}
            {run.origem === "skill" && " · pela skill"} · {roteirosInit.length}{" "}
            {roteirosInit.length === 1 ? "roteiro" : "roteiros"}
          </p>
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button size="sm"><UploadCloud className="w-4 h-4 mr-1.5" /> Subir conteúdo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir conteúdo deste briefing</DialogTitle>
              <DialogDescription>
                Anexa um roteiro à pasta de {dataLonga(run.geradoEm)}. Cole a tabela de cenas ou os campos do estático.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="sr-formato" className="text-xs font-medium text-gray-700">Formato</label>
                  <select id="sr-formato" value={form.formato}
                    onChange={(e) => setForm({ ...form, formato: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm">
                    <option value="video-narrado">Vídeo narrado</option>
                    <option value="video-apresentadora">Vídeo apresentadora</option>
                    <option value="estatico">Criativo estático</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sr-status" className="text-xs font-medium text-gray-700">Status</label>
                  <select id="sr-status" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm">
                    <option value="teste">Teste — não foi produzido</option>
                    <option value="aprovado">Aprovado — ainda não produzido</option>
                    <option value="produzido">Produzido — foi para mídia paga</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="sr-codigo" className="text-xs font-medium text-gray-700">Código</label>
                  <Input id="sr-codigo" value={form.codigo} placeholder="automático"
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="sr-duracao" className="text-xs font-medium text-gray-700">Duração</label>
                  <Input id="sr-duracao" value={form.duracao} placeholder="28 a 30s"
                    onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
                </div>
                <div className="flex items-end pb-2">
                  <label htmlFor="sr-monica" className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <input id="sr-monica" type="checkbox" checked={form.monica}
                      onChange={(e) => setForm({ ...form, monica: e.target.checked })} />
                    Com Mônica
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="sr-estrutura" className="text-xs font-medium text-gray-700">Tese da peça</label>
                <Input id="sr-estrutura" value={form.estrutura} placeholder="o que essa peça defende"
                  onChange={(e) => setForm({ ...form, estrutura: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="sr-muda" className="text-xs font-medium text-gray-700">O que muda</label>
                  <Input id="sr-muda" value={form.oQueMuda} placeholder="o que difere dos outros"
                    onChange={(e) => setForm({ ...form, oQueMuda: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="sr-derivado" className="text-xs font-medium text-gray-700">Derivado de</label>
                  <Input id="sr-derivado" value={form.derivadoDe} placeholder="R001"
                    onChange={(e) => setForm({ ...form, derivadoDe: e.target.value })} />
                </div>
              </div>

              <div>
                <label htmlFor="sr-conteudo" className="text-xs font-medium text-gray-700">
                  Conteúdo do roteiro <span className="text-red-500">*</span>
                </label>
                <Textarea id="sr-conteudo" rows={10} value={form.conteudoMd}
                  placeholder="Cole a tabela de cenas (markdown) ou os campos do estático."
                  onChange={(e) => setForm({ ...form, conteudoMd: e.target.value })} />
              </div>

              <div>
                <label htmlFor="sr-anexos" className="text-xs font-medium text-gray-700">
                  Links de peça, arte ou vídeo <span className="text-gray-400">(um por linha)</span>
                </label>
                <Textarea id="sr-anexos" rows={2} value={form.anexos}
                  onChange={(e) => setForm({ ...form, anexos: e.target.value })} />
              </div>

              {erro && <p className="text-xs text-red-600">{erro}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button onClick={subir} disabled={salvando || !form.conteudoMd.trim()}>
                {salvando ? "Subindo..." : "Anexar roteiro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!ehMaisRecente && (
        <Card className="mb-4 border-amber-300 bg-amber-50/60">
          <CardContent className="p-3.5 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Este é um briefing antigo.</strong> Os números são o retrato de{" "}
              {dataLonga(run.geradoEm)} — preço, cotas disponíveis e fase de obra já mudaram desde então. Serve para
              entender com que dados os roteiros abaixo foram escritos, não para enviar proposta.
            </p>
          </CardContent>
        </Card>
      )}

      {(run.artefatoUrl || run.docsUrl || run.anexos.length > 0 || run.observacao) && (
        <Card className="mb-4">
          <CardContent className="p-3.5 space-y-2">
            {run.observacao && <p className="text-xs text-gray-600 italic">{run.observacao}</p>}
            <div className="flex flex-wrap gap-2">
              {run.artefatoUrl && (
                <a href={run.artefatoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Artefato
                </a>
              )}
              {run.docsUrl && (
                <a href={run.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Google Docs
                </a>
              )}
              {run.anexos.map((a) => (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> {a.titulo ?? "Link"}
                </a>
              ))}
            </div>
            {run.artefatoUrl && (
              <p className="text-[11px] text-gray-400">
                O artefato pode estar privado na conta de quem gerou. O conteúdo completo está abaixo.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="briefing">
        <TabsList>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="roteiros">Roteiros ({roteirosInit.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="briefing" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <Md>{run.conteudoMd}</Md>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roteiros" className="mt-4 space-y-3">
          {roteirosInit.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <Clapperboard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">Nenhum roteiro nesta pasta</p>
                <p className="text-xs text-gray-500 mt-1">Use &quot;Subir conteúdo&quot; para anexar.</p>
              </CardContent>
            </Card>
          ) : (
            roteirosInit.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm text-gray-900">
                      {r.codigo} — {ROTULO_FORMATO[r.formato] ?? r.formato}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      r.status === "teste" ? "bg-amber-500 text-white"
                        : r.status === "produzido" ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-700"}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.duracao && <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{r.duracao}</span>}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {r.monica ? "com Mônica" : "sem Mônica"}
                    </span>
                    {r.derivadoDe && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        derivado de {r.derivadoDe}
                      </span>
                    )}
                  </div>

                  {r.status === "teste" && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 leading-relaxed">
                      <strong>Esta peça não foi produzida.</strong> O texto vale de referência, mas nunca foi ao ar —
                      não há resultado por trás dele e não serve como prova do que converte.
                    </p>
                  )}

                  {r.estrutura && <p className="text-xs text-gray-600 mb-1"><strong>Tese:</strong> {r.estrutura}</p>}
                  {r.oQueMuda && <p className="text-xs text-gray-600 mb-3"><strong>O que muda:</strong> {r.oQueMuda}</p>}

                  <Md>{r.conteudoMd}</Md>

                  {r.anexos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {r.anexos.map((a) => (
                        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" /> {a.titulo ?? "Peça"}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
