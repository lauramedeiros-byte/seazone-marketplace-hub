"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, FolderOpen, FileText, Clapperboard, BookOpen, ListChecks } from "lucide-react";

export type EmpreendimentoItem = {
  id: string;
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  totalBriefings: number;
  totalRoteiros: number;
  ultimoBriefing: string | null;
};

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function dataCurta(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function BriefingsClient({ empreendimentosInit }: { empreendimentosInit: EmpreendimentoItem[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cidade: "", estado: "", spotBuildingId: "" });

  const lista = useMemo(() => {
    const termo = semAcento(busca.trim());
    if (!termo) return empreendimentosInit;
    return empreendimentosInit.filter(
      (e) =>
        semAcento(e.nome).includes(termo) ||
        semAcento(e.cidade).includes(termo) ||
        semAcento(e.estado).includes(termo)
    );
  }, [busca, empreendimentosInit]);

  const comBriefing = empreendimentosInit.filter((e) => e.totalBriefings > 0).length;
  const totalRoteiros = empreendimentosInit.reduce((s, e) => s + e.totalRoteiros, 0);

  async function criar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/spot-empreendimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível criar.");
      setAberto(false);
      setForm({ nome: "", cidade: "", estado: "", spotBuildingId: "" });
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Briefings de SPOT</h1>
          <p className="text-gray-500 text-sm">
            Uma pasta por empreendimento. Dentro, cada briefing gerado com a data e os roteiros que saíram dele.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/briefings/como-gerar">
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-1.5" /> Como gerar
            </Button>
          </Link>
          <Link href="/briefings/regras">
            <Button variant="outline" size="sm">
              <ListChecks className="w-4 h-4 mr-1.5" /> Regras
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="busca-empreendimento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar empreendimento, cidade ou estado"
            className="pl-9"
          />
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Novo empreendimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo empreendimento</DialogTitle>
              <DialogDescription>
                Cria a pasta de um SPOT que ainda não está na lista. Os 37 de revenda já estão cadastrados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label htmlFor="novo-nome" className="text-xs font-medium text-gray-700">Nome</label>
                <Input id="novo-nome" value={form.nome} placeholder="Jurerê Spot III"
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label htmlFor="novo-cidade" className="text-xs font-medium text-gray-700">Cidade</label>
                  <Input id="novo-cidade" value={form.cidade} placeholder="Florianópolis"
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="novo-estado" className="text-xs font-medium text-gray-700">UF</label>
                  <Input id="novo-estado" value={form.estado} placeholder="SC" maxLength={2}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })} />
                </div>
              </div>
              <div>
                <label htmlFor="novo-szi" className="text-xs font-medium text-gray-700">
                  id do SZI <span className="text-gray-400">(opcional)</span>
                </label>
                <Input id="novo-szi" value={form.spotBuildingId} placeholder="17" inputMode="numeric"
                  onChange={(e) => setForm({ ...form, spotBuildingId: e.target.value })} />
              </div>
              {erro && <p className="text-xs text-red-600">{erro}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button onClick={criar} disabled={salvando || !form.nome || !form.cidade || !form.estado}>
                {salvando ? "Criando..." : "Criar pasta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {empreendimentosInit.length} empreendimentos · {comBriefing} com briefing gerado · {totalRoteiros} roteiros
        {busca && ` · ${lista.length} no filtro`}
      </p>

      {lista.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="p-8 text-center text-sm text-gray-500">
            Nenhum empreendimento encontrado para &quot;{busca}&quot;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lista.map((e) => (
            <Link key={e.id} href={`/briefings/${e.slug}`}>
              <Card className="h-full hover:border-blue-300 hover:shadow-sm transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2.5">
                    <FolderOpen
                      className={`w-5 h-5 shrink-0 mt-0.5 ${e.totalBriefings > 0 ? "text-blue-600" : "text-gray-300"}`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{e.nome}</p>
                      <p className="text-xs text-gray-500">
                        {e.cidade} - {e.estado}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {e.totalBriefings} {e.totalBriefings === 1 ? "briefing" : "briefings"}
                    </span>
                    {e.totalRoteiros > 0 && (
                      <span className="flex items-center gap-1">
                        <Clapperboard className="w-3.5 h-3.5" />
                        {e.totalRoteiros} {e.totalRoteiros === 1 ? "roteiro" : "roteiros"}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-gray-400">
                    {e.ultimoBriefing ? `Último em ${dataCurta(e.ultimoBriefing)}` : "Nenhum briefing ainda"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
