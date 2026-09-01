import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { BackButton } from "@/components/back-button";
import { BuscaId, IdsDoGrupo } from "./busca-id";
import "./crv.css";

const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Criativos de Revenda — Sondagem | Marketplace Hub",
  description:
    "O que cada grupo de criativos de Revenda promete e o que o time comercial precisa sondar do lead.",
};

export default function CriativosRevendaPage() {
  return (
    <div className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <BackButton />
      </div>

      <div className="crv">
      <div className="wrap">

        <header className="masthead">
          <div className="eyebrow"><span className="dot"></span> Revenda SPOT · criativos no ar 01/09</div>
          <h1>O que o lead viu antes de falar com você</h1>
          <nav className="jump">
            <a href="#g1">1 · Curto prazo</a>
            <a href="#g2">2 · Fluxo mais leve</a>
            <a href="#g3">3 · Entrada parcelada</a>
            <a href="#objecoes">Objeções</a>
          </nav>
          <BuscaId />
        </header>

        {/* ══════ GRUPO 1 ══════ */}
        <div className="group g-1" id="g1">
          <div className="group-banner">
            <span className="num">01</span>
            <div>
              <div className="t">Renda no curto prazo</div>
              <div className="s">Para quem quer começar a receber já — SPOTs em operação ou com entrega até 2027</div>
            </div>
          </div>

        <section>
          <div className="sec-head">
            <span className="tag">Anúncio</span>
            <h2>O que a peça promete</h2>
            <p className="sec-note">2 estáticos de feed + 1 reels narrado · público investidor</p>
          </div>
          <div className="body">

            <div className="promise">
              <div className="big">“Tenha renda com Airbnb no curto prazo”</div>
              <div className="sub">Invista em SPOTs em operação ou com entrega até 2027. CTA: <b>Encontre a melhor oportunidade de investimento</b>.</div>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="n">+130%</div>
                <div className="l">de valorização nos primeiros projetos entregues</div>
              </div>
              <div className="stat">
                <div className="n">15% <span style={{ fontSize: "15px", fontWeight: "600" }}>a.a.</span></div>
                <div className="l">ROI médio projetado do portfólio completo</div>
              </div>
              <div className="stat">
                <div className="n">10</div>
                <div className="l">empreendimentos elegíveis (de 45) entregues ou até 2027</div>
              </div>
            </div>

            <div className="assets">
              <div className="asset">
                <span className="fmt">FEED 1A</span>
                <span className="nm">Estático · piscina com vista mar<small>Apelo aspiracional, sem empreendimento nomeado</small></span>
              </div>
              <div className="asset">
                <span className="fmt">FEED 1B</span>
                <span className="nm">Estático · render do Japaratinga Spot<small>Lead pode citar o prédio da imagem — é o Japaratinga (AL)</small></span>
              </div>
              <div className="asset">
                <span className="fmt">REELS</span>
                <span className="nm">Vídeo narrado · E2 V1<small>Mesma promessa em vídeo</small></span>
                <a href="https://drive.google.com/drive/u/0/folders/1E5AhJXGzm2MSwC3t3WA8waFUzCOo1Rsr" target="_blank" rel="noopener">Abrir no Drive →</a>
              </div>
            </div>

            <IdsDoGrupo grupo="1" />

          </div>
        </section>

        {/* SONDAGEM */}
        <section id="sondar">
          <div className="sec-head">
            <span className="tag">Sondagem</span>
            <h2>O que descobrir na conversa</h2>
            <p className="sec-note">Na ordem — as duas primeiras são o que define se existe oportunidade</p>
          </div>
          <div className="body">
            <ol className="ask">

              <li>
                <span className="num">01</span>
                <div>
                  <div className="q-head"><span className="q-title">Faixa de valor que pretende investir</span><span className="must">Obrigatória</span></div>
                  <p className="say">Pra eu te mostrar o que faz sentido: que valor você pensou em colocar nesse investimento?</p>
                  <p className="why"><b>Anote também:</b> recurso já disponível, financiamento, ou depende de vender algo antes. <b>Serve para:</b> saber quais SPOTs e quais cotas cabem no bolso dele.</p>
                </div>
              </li>

              <li>
                <span className="num">02</span>
                <div>
                  <div className="q-head"><span className="q-title">Região de interesse</span><span className="must">Obrigatória</span></div>
                  <p className="say">Você já tem alguma região de interesse?</p>
                  <p className="why"><b>Anote também:</b> se já conhece o lugar e se pretende usar o imóvel. <b>Serve para:</b> só 10 dos 45 empreendimentos entram no curto prazo, e eles estão em 5 praças (veja abaixo).</p>
                </div>
              </li>

              <li>
                <span className="num">03</span>
                <div>
                  <div className="q-head"><span className="q-title">Quando quer começar a receber</span></div>
                  <p className="say">Você quer um imóvel que já esteja rendendo agora, ou pode esperar a entrega?</p>
                  <p className="why"><b>Serve para:</b> quem quer renda imediata vai para os já entregues; quem aceita esperar abre o portfólio inteiro.</p>
                </div>
              </li>

            </ol>
          </div>
        </section>

        {/* ESTOQUE */}
        <section id="estoque">
          <div className="sec-head">
            <span className="tag">Estoque</span>
            <h2>Os 10 SPOTs que sustentam a promessa</h2>
            <p className="sec-note">Datas e andamento de obra puxados do Spotsys em 01/09/2026. Disponibilidade de cotas: <a href="https://spotometro.seazone.com.br/" target="_blank" rel="noopener">Spotômetro → Revendas</a>.</p>
          </div>
          <div className="body">
            <div className="buckets">

              <div className="bucket now">
                <div className="bucket-head">
                  <span className="name">Já em operação</span>
                  <span className="count">3</span>
                  <span className="hint">Renda entrando agora</span>
                </div>
                <ul>
                  <li>
                    <span className="spot">Lagoa Spot</span>
                    <span className="where">Lagoa da Conceição · Floripa</span>
                    <span className="live">desde dez/25</span>
                  </li>
                  <li>
                    <span className="spot">Rosa Spot</span>
                    <span className="where">Praia do Rosa · Imbituba/SC</span>
                    <span className="live">desde dez/25</span>
                  </li>
                  <li>
                    <span className="spot">Urubici Spot</span>
                    <span className="where">Serra Catarinense/SC</span>
                    <span className="live">desde jun/26</span>
                  </li>
                </ul>
              </div>

              <div className="bucket">
                <div className="bucket-head">
                  <span className="name">Entrega em 2026</span>
                  <span className="count">4</span>
                  <span className="hint">Renda a partir do fim do ano</span>
                </div>
                <ul>
                  <li>
                    <span className="spot">Ingleses Spot</span>
                    <span className="where">Ingleses · Floripa — operação prevista nov/26</span>
                    <span className="gauge"><span className="bar"><i style={{ width: "81%" }} /></span><span className="pct">81% de obra</span></span>
                  </li>
                  <li>
                    <span className="spot">Rosa Sul Spot</span>
                    <span className="where">Praia do Rosa · Imbituba/SC — entrega prevista set/26</span>
                    <span className="gauge"><span className="bar"><i style={{ width: "77%" }} /></span><span className="pct">77% de obra</span></span>
                  </li>
                  <li>
                    <span className="spot">Trancoso Spot</span>
                    <span className="where">Trancoso · Porto Seguro/BA — operação prevista dez/26</span>
                    <span className="gauge"><span className="bar"><i style={{ width: "73%" }} /></span><span className="pct">73% de obra</span></span>
                  </li>
                  <li>
                    <span className="spot">Japaratinga Spot</span>
                    <span className="where">Japaratinga/AL — entrega prevista dez/26 · <span className="flag">atraso já comunicado, não crave a data</span></span>
                    <span className="gauge"><span className="bar"><i style={{ width: "42%" }} /></span><span className="pct">42% de obra</span></span>
                  </li>
                </ul>
              </div>

              <div className="bucket later">
                <div className="bucket-head">
                  <span className="name">Entrega em 2027</span>
                  <span className="count">3</span>
                  <span className="hint">Para quem aceita esperar</span>
                </div>
                <ul>
                  <li>
                    <span className="spot">Campeche Spot</span>
                    <span className="where">Campeche · Floripa — entrega prevista mai/27</span>
                    <span className="gauge"><span className="bar"><i style={{ width: "27%" }} /></span><span className="pct">27% de obra</span></span>
                  </li>
                  <li>
                    <span className="spot">Urubici Spot II</span>
                    <span className="where">Serra Catarinense/SC — entrega prevista dez/27</span>
                    <span className="gauge"><span className="bar"><i style={{ width: "30%" }} /></span><span className="pct">30% de obra</span></span>
                  </li>
                  <li>
                    <span className="spot">Jurerê Beach Spot</span>
                    <span className="where">Jurerê · Floripa — entrega prevista dez/27</span>
                    <span className="gauge"><span className="bar"><i style={{ width: "9%" }} /></span><span className="pct">9% de obra</span></span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        </div>{/* /grupo 1 */}

        {/* ══════ GRUPO 2 ══════ */}
        <div className="group g-2" id="g2">
          <div className="group-banner">
            <span className="num">02</span>
            <div>
              <div className="t">Fluxo de pagamento total mais leve</div>
              <div className="s">Para quem entra pela parcela mensal — obras longas, entrega a partir de 2029</div>
            </div>
          </div>

        <section>
          <div className="sec-head">
            <span className="tag">Anúncio</span>
            <h2>O que a peça promete</h2>
            <p className="sec-note">1 estático de story + vídeo · público investidor que entra pela parcela</p>
          </div>
          <div className="body">

            <div className="promise">
              <div className="big">“Invista em Airbnb com fluxo de pagamento facilitado”</div>
              <div className="sub">Parcelamentos em até <b>3 anos</b> para obras com entrega a partir de 2029. Mesmos números e mesmo CTA do Grupo 1.</div>
            </div>

            <div className="legal" style={{ borderColor: "var(--sea)", background: "var(--sea-soft)" }}>
              <h3 style={{ color: "var(--sea)" }}>Este lead não é o do Grupo 1</h3>
              <p>Aqui a obra é longa — entrega a partir de 2029. Quem chega por este anúncio quer <b>entrar pagando pouco por mês</b>, não receber renda agora. Não ofereça os SPOTs em operação sem antes entender isso.</p>
            </div>

            <div className="assets">
              <div className="asset">
                <span className="fmt">STORY 2</span>
                <span className="nm">Estático · render do Ponta das Canas Spot II<small>É o mesmo empreendimento que lidera o parcelamento — 46×</small></span>
              </div>
              <div className="asset">
                <span className="fmt">VÍDEO</span>
                <span className="nm">Peças em vídeo do grupo 2<small>Mesma promessa em movimento</small></span>
                <a href="https://drive.google.com/drive/u/0/folders/1cIFJu854I_hic_4Lw2XYt4mqKfVqyc3n" target="_blank" rel="noopener">Abrir no Drive →</a>
              </div>
            </div>

            <IdsDoGrupo grupo="2" />

          </div>
        </section>

        {/* SONDAGEM G2 */}
        <section id="sondar2">
          <div className="sec-head">
            <span className="tag">Sondagem</span>
            <h2>O que descobrir na conversa</h2>
            <p className="sec-note">As duas obrigatórias do Grupo 1 — sem a pergunta de prazo, que aqui não separa ninguém</p>
          </div>
          <div className="body">
            <ol className="ask">

              <li>
                <span className="num">01</span>
                <div>
                  <div className="q-head"><span className="q-title">Faixa de valor que pretende investir</span><span className="must">Obrigatória</span></div>
                  <p className="say">Pra eu te mostrar o que faz sentido: que valor você pensou em colocar nesse investimento?</p>
                </div>
              </li>

              <li>
                <span className="num">02</span>
                <div>
                  <div className="q-head"><span className="q-title">Região de interesse</span><span className="must">Obrigatória</span></div>
                  <p className="say">Você já tem alguma região de interesse?</p>
                </div>
              </li>

            </ol>
          </div>
        </section>

        {/* PARCELAMENTOS G2 */}
        <section id="parcelas">
          <div className="sec-head">
            <span className="tag">Parcelamento</span>
            <h2>Onde estão os melhores parcelamentos</h2>
            <p className="sec-note">O nº de parcelas e o valor mudam de cota para cota dentro do mesmo empreendimento — confirme no <a href="https://spotometro.seazone.com.br/" target="_blank" rel="noopener">Spotômetro → Revendas</a> antes de citar.</p>
          </div>
          <div className="body">

            <div className="rank-grid">

              <div className="rank">
                <div className="rank-head">
                  <div className="t">Parcela em mais vezes</div>
                  <div className="s">Maior número de parcelas encontrado em cada empreendimento</div>
                </div>
                <div className="top">
                  <span className="badge">1º</span>
                  <span className="nm">Ponta das Canas Spot II</span>
                  <span className="v">46×</span>
                </div>
                <ol>
                  <li><span className="rk">2</span><span className="nm">Foz Spot</span><span className="v">44×</span></li>
                  <li><span className="rk">3</span><span className="nm">Santinho Spot</span><span className="v">38×</span></li>
                  <li><span className="rk">4</span><span className="nm">Barra Grande Spot</span><span className="v">37×</span></li>
                  <li><span className="rk">5</span><span className="nm">Canas Beach Spot</span><span className="v">37×</span></li>
                  <li><span className="rk">6</span><span className="nm">Ponta das Canas Spot</span><span className="v">37×</span></li>
                </ol>
              </div>

              <div className="rank">
                <div className="rank-head">
                  <div className="t">Menor parcela mensal</div>
                  <div className="s">Cota mais barata por mês em cada empreendimento</div>
                </div>
                <div className="top">
                  <span className="badge">1º</span>
                  <span className="nm">Bonito Spot<small>26 parcelas</small></span>
                  <span className="v">R$ 1.056</span>
                </div>
                <ol>
                  <li><span className="rk">2</span><span className="nm">Santinho Spot<small>33 parcelas</small></span><span className="v">R$ 1.323</span></li>
                  <li><span className="rk">3</span><span className="nm">Urubici Spot II<small>14 parcelas</small></span><span className="v">R$ 1.414</span></li>
                  <li><span className="rk">4</span><span className="nm">Santo Antônio Spot<small>26 parcelas</small></span><span className="v">R$ 1.538</span></li>
                  <li><span className="rk">5</span><span className="nm">Foz Spot<small>37 parcelas</small></span><span className="v">R$ 1.568</span></li>
                  <li><span className="rk">6</span><span className="nm">Cachoeira Beach Spot<small>32 parcelas</small></span><span className="v">R$ 1.723</span></li>
                </ol>
              </div>

            </div>

            <div className="chips">
              <div className="chips-label">Tem cota abaixo de R$ 2.000/mês em</div>
              <div className="chips-row">
                <span>Bonito</span><span>Santinho</span><span>Foz</span><span>Santo Antônio</span><span>Cachoeira Beach</span><span>Ponta das Canas</span><span>Ponta das Canas II</span><span>Canas Beach</span><span>Ilha do Campeche II</span><span>Urubici II</span><span>Campeche</span>
              </div>
            </div>

          </div>
        </section>

        </div>{/* /grupo 2 */}

        {/* ══════ GRUPO 3 ══════ */}
        <div className="group g-3" id="g3">
          <div className="group-banner">
            <span className="num">03</span>
            <div>
              <div className="t">Entrada parcelada</div>
              <div className="s">Para quem trava na entrada — 122 cotas parcelam o sinal em 6× ou mais</div>
            </div>
          </div>

        <section>
          <div className="sec-head">
            <span className="tag">Anúncio</span>
            <h2>O que a peça promete</h2>
            <p className="sec-note">1 estático de feed · vídeos ainda não enviados</p>
          </div>
          <div className="body">

            <div className="promise">
              <div className="big">“Invista em Airbnb com valor de entrada parcelado em até 10x”</div>
              <div className="sub">Construa patrimônio em cidades com <b>alta valorização</b> e demanda comprovada por hospedagem. Mesmos números e mesmo CTA dos outros grupos.</div>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="n">122</div>
                <div className="l">cotas disponíveis com entrada em 6× ou mais</div>
              </div>
              <div className="stat">
                <div className="n">34</div>
                <div className="l">delas parcelam a entrada em 10× ou mais</div>
              </div>
              <div className="stat">
                <div className="n">29</div>
                <div className="l">empreendimentos com essa condição no marketplace</div>
              </div>
            </div>

            <div className="assets">
              <div className="asset">
                <span className="fmt">FEED 3</span>
                <span className="nm">Estático · render do Santinho Spot<small>O Santinho tem 6 cotas com entrada em 6× ou mais, 2 delas em 10×</small></span>
              </div>
              <div className="asset">
                <span className="fmt">VÍDEO</span>
                <span className="nm">Peças em vídeo do grupo 3<small>Link ainda não enviado pelo marketing</small></span>
              </div>
            </div>

            <IdsDoGrupo grupo="3" />

          </div>
        </section>

        {/* SONDAGEM G3 */}
        <section id="sondar3">
          <div className="sec-head">
            <span className="tag">Sondagem</span>
            <h2>O que descobrir na conversa</h2>
            <p className="sec-note">As mesmas duas obrigatórias do Grupo 2</p>
          </div>
          <div className="body">
            <ol className="ask">

              <li>
                <span className="num">01</span>
                <div>
                  <div className="q-head"><span className="q-title">Faixa de valor que pretende investir</span><span className="must">Obrigatória</span></div>
                  <p className="say">Pra eu te mostrar o que faz sentido: que valor você pensou em colocar nesse investimento?</p>
                </div>
              </li>

              <li>
                <span className="num">02</span>
                <div>
                  <div className="q-head"><span className="q-title">Região de interesse</span><span className="must">Obrigatória</span></div>
                  <p className="say">Você já tem alguma região de interesse?</p>
                </div>
              </li>

            </ol>
          </div>
        </section>

        {/* ENTRADAS G3 */}
        <section id="entradas">
          <div className="sec-head">
            <span className="tag">Entradas</span>
            <h2>Onde a entrada parcela em mais vezes</h2>
            <p className="sec-note">Só cotas com status <b>disponível</b> no marketplace, coluna Entradas do <a href="https://spotometro.seazone.com.br/" target="_blank" rel="noopener">Spotômetro</a> · dados de 01/09/2026</p>
          </div>
          <div className="body">

            <div className="rank-grid">

              <div className="rank">
                <div className="rank-head">
                  <div className="t">Entrada em mais vezes</div>
                  <div className="s">Maior parcelamento de entrada encontrado em cada empreendimento</div>
                </div>
                <div className="top">
                  <span className="badge">1º</span>
                  <span className="nm">Sul da Ilha Spot<small>Floripa · 7 cotas em 10× ou mais</small></span>
                  <span className="v">12×</span>
                </div>
                <ol>
                  <li><span className="rk">2</span><span className="nm">Ilha do Campeche Spot<small>Floripa · 10 cotas em 6× ou mais</small></span><span className="v">10×</span></li>
                  <li><span className="rk">3</span><span className="nm">Cachoeira Beach Spot<small>Floripa · 9 cotas em 6× ou mais</small></span><span className="v">10×</span></li>
                  <li><span className="rk">4</span><span className="nm">Cachoeira Spot<small>Floripa · 9 cotas em 6× ou mais</small></span><span className="v">10×</span></li>
                  <li><span className="rk">5</span><span className="nm">Batel Spot<small>Curitiba · 8 cotas em 6× ou mais</small></span><span className="v">10×</span></li>
                  <li><span className="rk">6</span><span className="nm">Ponta das Canas Spot<small>Floripa · 6 cotas em 6× ou mais</small></span><span className="v">10×</span></li>
                </ol>
              </div>

              <div className="rank">
                <div className="rank-head">
                  <div className="t">Mais opção de cota</div>
                  <div className="s">Quantidade de cotas disponíveis com entrada em 6× ou mais</div>
                </div>
                <div className="top">
                  <span className="badge">1º</span>
                  <span className="nm">Ilha do Campeche Spot<small>16 cotas disponíveis no total</small></span>
                  <span className="v">10 cotas</span>
                </div>
                <ol>
                  <li><span className="rk">2</span><span className="nm">Sul da Ilha Spot<small>entrada chega a 12×</small></span><span className="v">10 cotas</span></li>
                  <li><span className="rk">3</span><span className="nm">Cachoeira Beach Spot<small>entrada chega a 10×</small></span><span className="v">9 cotas</span></li>
                  <li><span className="rk">4</span><span className="nm">Cachoeira Spot<small>entrada chega a 10×</small></span><span className="v">9 cotas</span></li>
                  <li><span className="rk">5</span><span className="nm">Batel Spot<small>entrada chega a 10×</small></span><span className="v">8 cotas</span></li>
                  <li><span className="rk">6</span><span className="nm">Japaratinga Spot<small>entrada chega a 6×</small></span><span className="v">6 cotas</span></li>
                </ol>
              </div>

            </div>

            <div className="chips">
              <div className="chips-label">Tem cota com entrada em 10× ou mais em</div>
              <div className="chips-row">
                <span>Sul da Ilha</span><span>Ilha do Campeche</span><span>Ilha do Campeche II</span><span>Cachoeira</span><span>Cachoeira Beach</span><span>Batel</span><span>Ponta das Canas</span><span>Morro das Pedras</span><span>Santinho</span><span>Santo Antônio</span><span>Urubici II</span><span>Rosa Norte</span><span>Rosa</span><span>Salvador</span><span>Campeche</span><span>Imbassaí</span><span>Bonito</span><span>Foz</span><span>Lagoa</span>
              </div>
            </div>

            <div className="obj">
              <div className="lead">Não ofereça entrada parcelada nestes</div>
              <p><b>Penha, Trancoso e Barra Grande</b> só têm cota com entrada em até 3×. Se o lead veio por este anúncio, não são a opção.</p>
            </div>

          </div>
        </section>

        </div>{/* /grupo 3 */}

        {/* OBJEÇÕES */}
        <section id="objecoes">
          <div className="sec-head">
            <span className="tag sea">Vale para os três grupos</span>
            <h2>Objeções que vêm do anúncio</h2>
          </div>
          <div className="body">

            <div className="obj">
              <div className="lead">“Esses 130% são garantidos?”</div>
              <p>Não. É valorização <b>já realizada</b> nos quatro SPOTs que a Seazone entregou — resultado passado, não promessa de futuro. Os números divulgados são estes:</p>
              <ul className="proof">
                <li><span className="n">Rosa Spot</span><span className="v">154%</span></li>
                <li><span className="n">Lagoa Spot</span><span className="v">152%</span></li>
                <li><span className="n">Jurerê Spot</span><span className="v">143%</span></li>
                <li><span className="n">Penha Spot</span><span className="v">132%</span></li>
                <li><span className="n"><b>Média dos entregues</b></span><span className="v"><b>145%</b></span></li>
              </ul>
              <p>Repare: o <b>+130% do anúncio é o piso</b> do que já foi entregue, não o teto. Use isso a favor — o que a Seazone acerta é a escolha da região antes de comprar o terreno, e é esse método que ela entrega, não um percentual. <b>Nunca prometa repetição.</b></p>
              <p className="side"><b>Só se precisar:</b> a valorização média projetada dos 42 SPOTs lançados é de <b>74%</b>. É a projeção de lançamento, não resultado — serve para responder o que se espera de um projeto ainda em obra.</p>
            </div>

            <div className="obj">
              <div className="lead">“15% ao ano é rendimento fixo?”</div>
              <p>Não — e não é o número de nenhum SPOT específico. Os 15% são a <b>média projetada do portfólio inteiro</b>. A projeção muda bastante de região para região: praia consolidada, serra e Nordeste têm ocupação e diária diferentes, então tem empreendimento acima e empreendimento abaixo dessa média. Se o lead quiser o número de um projeto, puxe a projeção daquele SPOT no material de vendas — não estime na conversa. E em nenhum caso é garantia: a Seazone não oferece rendimento fixo, retorno mínimo nem remuneração automática sobre o capital.</p>
            </div>

            <div className="obj">
              <div className="lead">“Achei caro.”</div>
              <p>Não encerre a conversa. Pergunte se ele está aberto a receber opções com <b>ticket menor em outras regiões</b> — e mande uma cota efetivamente mais barata. No Grupo 2, a saída é a parcela: tem cota a partir de R$ 1.056 por mês.</p>
            </div>

          </div>
        </section>

        <div className="legal">
          <h3>Regra de compliance</h3>
          <p>Valores estimados. A valorização citada refere-se a projetos já entregues e resultado passado não garante resultado futuro; o ROI é uma projeção média do portfólio, não promessa de rentabilidade. A Seazone não oferece garantia de rendimento fixo, retorno mínimo ou qualquer tipo de remuneração automática sobre o capital investido. <b>Não repita número sem essa ressalva.</b></p>
        </div>

        <footer>Seazone · Marketing para o time comercial · atualizado em 01/09/2026</footer>

      </div>
      </div>
    </div>
  );
}
