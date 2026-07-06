import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const MES = "2026-07";
const SPREAD_TIMING = "https://docs.google.com/spreadsheets/d/1acV7PDrCFoznoxIpVWSwY3W4bCFoxlXnpEu0xxhuaYw/edit?gid=1392382642#gid=1392382642";
const BASE_TIMING = "Lost timing p28 — reunião realizada, sem compra posterior em P28/37, última ação = lost por timing";

async function main() {
  const existing = await db.planejamentoFrente.count();
  if (existing > 0) {
    console.log(`Já existem ${existing} frentes — pulando seed para não duplicar.`);
    return;
  }

  const mkt = await db.planejamentoFrente.create({ data: { nome: "Disparos Marketplace", cor: "teal", ordem: 0 } });
  const szs = await db.planejamentoFrente.create({ data: { nome: "Disparos SZS Gestão", cor: "indigo", ordem: 1 } });
  const com = await db.planejamentoFrente.create({ data: { nome: "Comunidade Mônica", cor: "pink", ordem: 2 } });
  const social = await db.planejamentoFrente.create({ data: { nome: "Social", cor: "amber", ordem: 3 } });

  const acoes = [
    // ── Disparos Marketplace ──
    { f: mkt, dia: 1, titulo: "OPP da Semana — e-mail", base: "Base automática da Gaby/Claude", empreendimentos: "Rosa Norte SPOT", email: "#entrega-disparos" },
    { f: mkt, dia: 2, titulo: "OPP da Semana — MIA", base: "Base automática da Gaby/Claude", empreendimentos: "Rosa Norte SPOT", whatsapp: "#entrega-disparos" },
    { f: mkt, dia: 2, titulo: "Losts por timing SZI — Ponta das Canas (ofertar Ponta das Canas I)", base: BASE_TIMING, empreendimentos: "Ponta das Canas SPOT (ofertar próximo ao interesse inicial)", whatsapp: "Oi! Aqui é a Seazone. Apresentamos investimento na região de Ponta das Canas há um tempo, mas não fazia sentido no momento. Temos uma cota no Ponta das Canas SPOT com valor atrativo: R$ 240 mil. Frente mar, piscina aquecida, minimarket e localização premium. *Não aceitamos FGTS e carta de crédito.", links: [{ label: "Base lost timing", url: SPREAD_TIMING }] },
    { f: mkt, dia: 3, titulo: "Losts por timing SZI — Barra Grande + Itacaré (ofertar Japaratinga)", base: BASE_TIMING, empreendimentos: "Japaratinga SPOT (litoral de AL)", whatsapp: "Oi! Aqui é a Seazone. Apresentamos um projeto de SPOT para você há um tempo. Temos o Japaratinga SPOT, litoral de Alagoas, entrega dez deste ano — começa a faturar no curto prazo. A 110m da praia, rooftop com piscina de borda infinita e vista mar. Investimento: R$ 304 mil, até 5x. *Não aceitamos FGTS e carta de crédito.", links: [{ label: "Base lost timing", url: SPREAD_TIMING }] },
    { f: mkt, dia: 3, titulo: "Losts por timing SZI — Novo Campeche (ofertar Novo Campeche I, ágio zero)", base: BASE_TIMING, empreendimentos: "Novo Campeche SPOT (ágio zero)", whatsapp: "Oi, {{1}}! Lembra quando conversamos sobre um Spot no Campeche? Temos uma cota com valor de lançamento no Novo Campeche Spot: com ágio zero, R$ 370.606, garden integrado e parcelamento. Piscina aquecida com vista mar e minimarket. Vamos marcar 20 minutos? *Não aceitamos FGTS e carta de crédito.", links: [{ label: "Base lost timing", url: SPREAD_TIMING }] },
    { f: mkt, dia: 6, titulo: "Losts por timing SZI — Canas Beach (ofertar Canas Beach)", base: BASE_TIMING, empreendimentos: "Canas Beach SPOT", whatsapp: "FAZER E MANDAR NO GRUPO DE DISPAROS", links: [{ label: "Base lost timing", url: SPREAD_TIMING }] },
    { f: mkt, dia: 6, titulo: "OPP da Semana — Foz", base: "Base que a Gaby puxa no Claude", empreendimentos: "Foz SPOT", whatsapp: "Alerta de oportunidade: Foz Spot 32% abaixo do valor de mercado. Zona central de Foz do Iguaçu-PR, próximo às Cataratas. Valor: R$ 290.000 (32% abaixo do mercado, R$ 137 mil de economia). Entrega 2030. Faturamento líquido projetado: R$ 3.600/mês com gestão Seazone.", email: "Assunto: Foz Spot: 32% abaixo do mercado, economize R$ 137 mil. Valor de mercado R$ 427.729 → Foz Spot R$ 290.000. Entrega 2030, projeção líquida R$ 3.600/mês com gestão Seazone." },
    { f: mkt, dia: 6, titulo: "Hóspedes Lagoa SPOT", base: "Hóspedes do Lagoa SPOT (base completa), tirando quem cancelou a reserva", empreendimentos: "Santo Antônio SPOT + Lagoa SPOT" },
    { f: mkt, dia: 7, titulo: "Lost na etapa de reunião realizada (abr, mai e jun/2026)", base: "priorizar motivo valor de entrada/valor total e separar por empreendimento/região" },
    { f: mkt, dia: 8, titulo: "Losts da Nevine", base: "Base Lost - Nevine", empreendimentos: "por etapa do lost + empreendimento de interesse", links: [{ label: "Base Lost - Nevine", url: "https://docs.google.com/spreadsheets/d/1gKziXzfcDUn3n7Zka88S2nyJi5t9Av6gGJnG_iBPlPU/edit?gid=268259101#gid=268259101" }] },
    { f: mkt, dia: 9, titulo: "Lost na etapa de reunião realizada (jan, fev e mar)", base: "priorizar motivo valor de entrada/valor total e separar por empreendimento/região" },
    { f: mkt, dia: 10, titulo: "Lost na etapa de No Show (abr, mai e jun/2026)", base: "priorizar motivo valor de entrada/valor total e separar por empreendimento/região" },
    { f: mkt, dia: 13, titulo: "Lost na etapa de No Show (jan, fev e mar)", base: "priorizar motivo valor de entrada/valor total e separar por empreendimento/região" },
    { f: mkt, dia: 14, titulo: "Lost na etapa de negociação/contrato (abr, mai e jun/2026)", base: "priorizar motivo valor de entrada/valor total e separar por empreendimento/região" },
    { f: mkt, dia: 15, titulo: "Lost na etapa de negociação/contrato (jan, fev e mar)", base: "priorizar motivo valor de entrada/valor total e separar por empreendimento/região" },
    { f: mkt, dia: 16, titulo: "Repescagem da última semana (fora do SLA)", base: "últimas 3 semanas" },
    { f: mkt, dia: 17, titulo: "Losts — Aguardando Data", base: "priorizar valor de entrada/valor total" },
    { f: mkt, dia: 20, titulo: "Reativação (2º disparo) Losts por timing SZI — MIA", base: "pegar quem ficou em lead in" },
    { f: mkt, dia: 21, titulo: "Hóspedes Vistas de Anitá (abr, mai e jun/2026)", empreendimentos: "Vistas" },
    { f: mkt, dia: 22, titulo: "Hóspedes de Airbnbs próximos do Rosa SPOT", empreendimentos: "Rosa Norte e Rosa Sul" },
    { f: mkt, dia: 23, titulo: "Base SZS — 2 ou + imóveis sob gestão e ainda não é investidor" },
    { f: mkt, dia: 24, titulo: "Base SZS — 1 imóvel sob gestão e não é investidor" },
    { f: mkt, dia: 27, titulo: "Losts SZS Não atende / Não responde (motivo em maior quantidade no funil)" },
    { f: mkt, dia: 28, titulo: "Hóspedes Seazone com gasto em hospedagem > R$ 3000, até 4 diárias" },
    { f: mkt, dia: 29, titulo: "Encaixar o que deu certo na 1ª quinzena" },
    { f: mkt, dia: 31, titulo: "Hóspedes do Urubici SPOT", whatsapp: "case de Urubici" },

    // ── Disparos SZS Gestão ──
    { f: szs, dia: 3, titulo: "Lost reunião — motivo timing (dez/25 a mar/26, origem marketing)", anotacoes: "Oferta: benefícios da gestão profissional. Usar mensagens da cadência da Sirius." },
    { f: szs, dia: 6, titulo: "Lost No Show de reunião", anotacoes: "Oferta: benefícios da gestão profissional" },
    { f: szs, dia: 6, titulo: "Proprietários Rosa/Lagoa/Penha que não fecharam gestão", anotacoes: "Oferta: desconto na taxa de adesão e na taxa de gestão — ver quem fechou Decor p/ taxa isenta" },
    { f: szs, dia: 7, titulo: "SZI/Lançamentos/MKTplace — clientes com 2 ou + SPOTs", anotacoes: "Oferta: benefícios gestão profissional" },
    { f: szs, dia: 8, titulo: "SZI/Lançamentos/MKTplace — clientes com 1 SPOT", base: "base grande, quebrar disparos e fazer p/ base toda", anotacoes: "Oferta: benefícios gestão profissional" },

    // ── Comunidade Mônica ──
    { f: com, dia: 1, titulo: "Conteúdo Comunidade Mônica (referência)", anotacoes: "Doc base de conteúdos para a comunidade da Mônica no Instagram.", links: [{ label: "Conteúdo Comunidade Mônica", url: "https://docs.google.com/document/d/1IWbV10KN_5tHo4GdAyhGGLRWRkzbzS4LvXlO77Y2FoI/edit?tab=t.0" }] },

    // ── Social ──
    { f: social, dia: 1, titulo: "Formas diferentes de passar as opps", anotacoes: "Carrossel; vídeo contando uma historinha da região e o potencial dela para Airbnb → conecta e traz para vender o SPOT." },
    { f: social, dia: 1, titulo: "Card no-show (PDF 1 página)", anotacoes: "Card para reduzir no-show. 1 página: logo Seazone + SPOT, 'Sua reunião está chegando', diferenciais do modelo SPOT, gestão de +3600 imóveis, selo SuperHost.", links: [{ label: "Ref. de layout (PDF Benefícios)", url: "https://drive.google.com/drive/folders/1_lF0lW8iuhE6bWNxVqG_BGDhWl-s2doV" }] },
  ];

  let ordem = 0;
  for (const a of acoes) {
    await db.planejamentoAcao.create({
      data: {
        frenteId: a.f.id,
        mes: MES,
        dia: a.dia,
        titulo: a.titulo,
        base: a.base ?? null,
        empreendimentos: a.empreendimentos ?? null,
        whatsapp: a.whatsapp ?? null,
        email: a.email ?? null,
        anotacoes: a.anotacoes ?? null,
        links: a.links ?? [],
        ordem: ordem++,
      },
    });
  }
  console.log(`Seed concluído: 4 frentes e ${acoes.length} ações de julho/2026.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
