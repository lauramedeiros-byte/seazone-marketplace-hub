"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ── Repescagem ──────────────────────────────────────────────────────────────

export async function createRepescagemEmpreendimento(
  nomeEmpreendimento: string,
  userId?: string
) {
  await db.repescagemEmpreendimento.create({
    data: { nomeEmpreendimento, criadoPorId: userId },
  });
  revalidatePath("/respescagem");
}

export async function updateRepescagemTexto(
  id: string,
  textoConteudo: string
) {
  await db.repescagemEmpreendimento.update({
    where: { id },
    data: { textoConteudo, dataUltimaAtualizacao: new Date() },
  });
  revalidatePath("/respescagem");
}

export async function deleteRepescagemEmpreendimento(id: string) {
  await db.repescagemEmpreendimento.delete({ where: { id } });
  revalidatePath("/respescagem");
}

export async function createRepescagemNumero(
  empreendimentoId: string,
  campoNome: string,
  userId?: string
) {
  await db.repescagemNumero.create({
    data: { empreendimentoId, campoNome },
  });
  revalidatePath("/respescagem");
}

export async function updateRepescagemNumero(
  id: string,
  data: { campoNome?: string; valorAtual?: string }
) {
  await db.repescagemNumero.update({ where: { id }, data });
  revalidatePath("/respescagem");
}

export async function deleteRepescagemNumero(id: string) {
  await db.repescagemNumero.delete({ where: { id } });
  revalidatePath("/respescagem");
}

// ── Opps da Semana ─────────────────────────────────────────────────────────

export async function getOrCreateOppSemana(weekStart: Date) {
  const startOfDay = new Date(weekStart);
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await db.oppSemana.findUnique({
    where: { weekStart: startOfDay },
  });
  if (existing) return existing;

  return db.oppSemana.create({
    data: { weekStart: startOfDay },
  });
}

export async function createOppItem(
  semanaId: string,
  data: {
    nomeEmpreendimento: string;
    localizacao?: string;
    preco?: string;
    condicoes?: string;
    userId?: string;
  }
) {
  const item = await db.oppItem.create({
    data: {
      semanaId,
      nomeEmpreendimento: data.nomeEmpreendimento,
      localizacao: data.localizacao,
      preco: data.preco,
      condicoes: data.condicoes,
      criadoPorId: data.userId,
    },
  });
  revalidatePath("/opps-da-semana");
  return item;
}

export async function updateOppItem(
  id: string,
  data: Partial<{
    nomeEmpreendimento: string;
    localizacao: string;
    preco: string;
    condicoes: string;
    destaque: boolean;
    tipoDestaque: string;
    textoWhatsapp: string;
    textoEmail: string;
    observacoes: string;
    Disparado: boolean;
    dataDisparo: Date;
    comentarioDisparo: string;
  }>
) {
  await db.oppItem.update({ where: { id }, data });
  revalidatePath("/opps-da-semana");
}

export async function deleteOppItem(id: string) {
  await db.oppItem.delete({ where: { id } });
  revalidatePath("/opps-da-semana");
}

export async function updateOppSemanaObservacoes(
  id: string,
  observacoes: string
) {
  await db.oppSemana.update({ where: { id }, data: { observacoes } });
  revalidatePath("/opps-da-semana");
}

// ── Losts ───────────────────────────────────────────────────────────────────

export async function createLostGrupo(nomeMotivo: string, userId?: string) {
  const grupo = await db.lostGrupo.create({
    data: { nomeMotivo, criadoPorId: userId },
  });
  revalidatePath("/losts");
  return grupo;
}

export async function updateLostGrupo(id: string, nomeMotivo: string) {
  await db.lostGrupo.update({ where: { id }, data: { nomeMotivo } });
  revalidatePath("/losts");
}

export async function deleteLostGrupo(id: string) {
  await db.lostGrupo.delete({ where: { id } });
  revalidatePath("/losts");
}

export async function createLostDisparo(
  grupoId: string,
  data: {
    dataDisparo?: Date;
    dataRangeInicio?: Date;
    dataRangeFim?: Date;
    etapaFiltro?: string;
    textoEmail?: string;
    textoWhatsapp?: string;
    userId?: string;
  }
) {
  const disparo = await db.lostDisparo.create({
    data: {
      grupoId,
      dataDisparo: data.dataDisparo,
      dataRangeInicio: data.dataRangeInicio,
      dataRangeFim: data.dataRangeFim,
      etapaFiltro: data.etapaFiltro,
      textoEmail: data.textoEmail,
      textoWhatsapp: data.textoWhatsapp,
      criadoPorId: data.userId,
    },
  });
  revalidatePath("/losts");
  return disparo;
}

export async function updateLostDisparo(
  id: string,
  data: Partial<{
    dataDisparo: Date;
    dataRangeInicio: Date;
    dataRangeFim: Date;
    etapaFiltro: string;
    textoEmail: string;
    textoWhatsapp: string;
    statusDisparo: string;
    Disparado: boolean;
    comentarioDisparo: string;
    comentarioNaoDisparo: string;
  }>
) {
  await db.lostDisparo.update({ where: { id }, data });
  revalidatePath("/losts");
}

export async function deleteLostDisparo(id: string) {
  await db.lostDisparo.delete({ where: { id } });
  revalidatePath("/losts");
}

export async function addLostHistorico(
  disparoId: string,
  tipoEvento: string,
  comentario: string,
  userId?: string
) {
  await db.lostHistorico.create({
    data: { disparoId, tipoEvento, comentario, criadoPorId: userId },
  });
  revalidatePath("/losts");
}

// ── Briefings ─────────────────────────────────────────────────────────────

export async function createBriefing(
  data: {
    titulo: string;
    empresa?: string;
    canal?: string;
    codigoProtecao?: string;
    userId: string;
  }
) {
  await db.briefing.create({ data });
  revalidatePath("/briefings");
}

export async function updateBriefing(
  id: string,
  data: Partial<{
    titulo: string;
    empresa: string;
    canal: string;
    formularioJson: unknown;
    status: string;
    codigoProtecao: string;
    dataPublicacao: Date;
  }>
) {
  await db.briefing.update({ where: { id }, data });
  revalidatePath("/briefings");
  revalidatePath(`/briefings/${id}`);
}

export async function deleteBriefing(id: string) {
  await db.briefing.delete({ where: { id } });
  revalidatePath("/briefings");
}

// ── Metas ────────────────────────────────────────────────────────────────────

export async function createMeta(
  data: {
    trimestre: string;
    metaNome: string;
    tipo: string;
    valorMeta: number;
    valorAtual?: number;
    userId: string;
  }
) {
  await db.meta.create({
    data: {
      trimestre: data.trimestre,
      metaNome: data.metaNome,
      tipo: data.tipo,
      valorMeta: data.valorMeta,
      valorAtual: data.valorAtual ?? 0,
      criadoPorId: data.userId,
    },
  });
  revalidatePath("/acompanhamento-de-metas");
}

export async function updateMeta(
  id: string,
  data: Partial<{
    metaNome: string;
    tipo: string;
    valorMeta: number;
    valorAtual: number;
    metricasPeriodicas: unknown;
  }>
) {
  await db.meta.update({ where: { id }, data });
  revalidatePath("/acompanhamento-de-metas");
}

export async function deleteMeta(id: string) {
  await db.meta.delete({ where: { id } });
  revalidatePath("/acompanhamento-de-metas");
}

// ── Artefatos ───────────────────────────────────────────────────────────────

export async function createArtefato(
  data: {
    tipo: string;
    titulo: string;
    descricao?: string;
    descricaoDados?: string;
    configuracaoJson?: unknown;
    userId: string;
  }
) {
  const artefato = await db.artefatoConfig.create({
    data: {
      tipo: data.tipo,
      titulo: data.titulo,
      descricao: data.descricao,
      descricaoDados: data.descricaoDados,
      configuracaoJson: data.configuracaoJson,
      criadoPorId: data.userId,
    },
  });
  revalidatePath("/artefatos-de-consulta");
  return artefato;
}

export async function updateArtefato(
  id: string,
  data: Partial<{
    tipo: string;
    titulo: string;
    descricao: string;
    descricaoDados: string;
    configuracaoJson: unknown;
  }>
) {
  await db.artefatoConfig.update({ where: { id }, data });
  revalidatePath("/artefatos-de-consulta");
}

export async function deleteArtefato(id: string) {
  await db.artefatoConfig.delete({ where: { id } });
  revalidatePath("/artefatos-de-consulta");
}
