// Build estático da landing page low ticket (sem dependências). Fábrica Low Ticket OS V2.1
// Uso: node build.mjs            -> prévia (noindex, aceita pendências com aviso)
//      node build.mjs --producao -> falha se houver checkout, pixel, preço ou dado pendente
// Na Vercel, o modo produção é ativado sozinho quando VERCEL_ENV=production.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const PRODUCAO = process.argv.includes('--producao') || process.env.FLT_PRODUCAO === '1' || process.env.VERCEL_ENV === 'production';
const SAIDA = join(RAIZ, 'dist');
const IMG_DIR = join(RAIZ, 'public', 'img');

const carregar = async (arq) => (await import(pathToFileURL(join(RAIZ, 'src', arq)).href)).default;
const c = await carregar('content.js');
const com = await carregar('comercial.js');
const ras = await carregar('rastreamento.js');
const tema = await carregar('tema.js');

const avisos = [];
const erros = [];
const grave = (msg) => (PRODUCAO ? erros : avisos).push(msg);
const PENDENTE = /DADO A FORNECER|lorem ipsum|NOME DO B[OÔ]NUS|\[[^\]\n]{1,80}\]/i;
const URGENCIA = /apenas hoje|s[óo] hoje|termina hoje|[úu]ltimas? vagas|[úu]ltima chance|pr[óo]ximos \d+|tempo limitado|oferta por tempo/i;

// ---------- utilidades ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// *palavra* vira destaque colorido (padrão das páginas da mentoria)
const rico = (s = '') => esc(s).replace(/\*([^*]+)\*/g, '<span class="destaque">$1</span>');
const brl = (v) => v == null ? '' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quase = (a, b) => Math.abs(a - b) < 0.005;

const ICONES = {
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  alvo: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  celular: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  lista: '<path d="M9 7h10M9 12h10M9 17h10"/><path d="M4.5 7h.5M4.5 12h.5M4.5 17h.5"/>',
  escudo: '<path d="M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
  raio: '<path d="M13 3L5.5 13.5H11L10 21l8.5-11H13z"/>',
  planilha: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 15h16M10 4v16"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  lampada: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  presente: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-2-4-6-4-6-1.5S9 9 12 9zM12 9c2-4 6-4 6-1.5S15 9 12 9z"/>',
  cadeado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  email: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  estrela: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
};
const icone = (nome, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nome] || ICONES.check}</svg>`;
const pill = (texto, tipo = '', ic = '') => texto ? `<span class="pill ${tipo}">${ic ? icone(ic, 'ico ico-pill') : ''}${esc(texto)}</span>` : '';

function dimensoesWebp(caminho) {
  const b = readFileSync(caminho);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const tipo = b.toString('ascii', 12, 16);
  if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (tipo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (tipo === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  return null;
}
function img(base, alt, { prioridade = false, sizes = '(max-width: 768px) 92vw, 520px', cls = '' } = {}) {
  const tamanhos = [400, 800, 1200].filter((w) => existsSync(join(IMG_DIR, `${base}-${w}.webp`)));
  if (!tamanhos.length) {
    grave(`imagem ausente: public/img/${base}-800.webp`);
    return `<div class="placeholder ${cls}" role="img" aria-label="${esc(alt)}">${esc(base)}</div>`;
  }
  const maior = tamanhos[tamanhos.length - 1];
  const d = dimensoesWebp(join(IMG_DIR, `${base}-${maior}.webp`)) || { w: 800, h: 1000 };
  const srcset = tamanhos.map((w) => `img/${base}-${w}.webp ${Math.min(w, d.w)}w`).join(', ');
  const carga = prioridade ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<img class="${cls}" src="img/${base}-${tamanhos.includes(800) ? 800 : maior}.webp" srcset="${srcset}" sizes="${sizes}" width="${d.w}" height="${d.h}" alt="${esc(alt)}" ${carga}>`;
}

// ---------- botões ----------
const btnRolagem = (texto) => `<a href="#o-que-voce-recebe" class="btn" data-cta="rolagem">${esc(texto)}</a>`;
function btnCheckout(texto, local, { url = com.checkoutUrl, valor = com.preco, plano = '' } = {}) {
  const valido = url && /^https:\/\//.test(url) && !PENDENTE.test(url);
  if (!valido) {
    grave(`checkoutUrl ausente ou inválida (${local}${plano ? ' · ' + plano : ''})`);
    return `<a href="#oferta" class="btn" data-cta="checkout-pendente" data-local="${local}">${esc(texto)}</a><p class="aviso-previa">Prévia: checkout ainda não configurado.</p>`;
  }
  return `<a href="${esc(url)}" class="btn" data-cta="checkout" data-local="${local}" data-plano="${esc(plano)}" data-value="${valor ?? ''}" data-currency="${com.moeda || 'BRL'}">${esc(texto)}</a>`;
}

// ---------- validações comerciais ----------
function conferePreco(rotulo, exibido, cadastro) {
  if (exibido == null) { grave(`preço ausente (${rotulo})`); return; }
  if (cadastro != null && com.taxaCheckout != null && !quase(cadastro + com.taxaCheckout, exibido)) {
    grave(`preço da página (${rotulo}) ${brl(exibido)} difere de cadastro ${brl(cadastro)} + taxa ${brl(com.taxaCheckout)}`);
  }
}
const planos = Array.isArray(com.planos) && com.planos.length ? com.planos : null;
if (planos) planos.forEach((p) => conferePreco(p.nome, p.preco, p.precoCadastro));
else conferePreco('preço único', com.preco, com.precoCadastro);
if (com.garantiaDias == null) grave('garantiaDias ausente em src/comercial.js');
if (PRODUCAO && !ras.pixelId) erros.push('pixelId ausente em src/rastreamento.js');
if (PRODUCAO && !ras.clarityId) erros.push('clarityId ausente em src/rastreamento.js');

const lista = (itens, ic = 'check') => `<ul class="checks">${itens.map((t) => `<li>${icone(ic)}<span>${rico(t)}</span></li>`).join('')}</ul>`;
const listaNao = (itens) => itens?.length ? `<ul class="checks nao">${itens.map((t) => `<li>${icone('x')}<span>${esc(t)}</span></li>`).join('')}</ul>` : '';
const secao = (id, cls, inner) => `<section ${id ? `id="${id}" ` : ''}class="sec ${cls}">\n<div class="wrap">${inner}</div>\n</section>`;
const titulo = (t, sub) => `<h2 class="revelar">${rico(t)}</h2>${sub ? `<p class="sub-secao">${rico(sub)}</p>` : ''}`;

function carrossel(id, rotulo, slides, autoplay = false, intervalo = 3500) {
  const itens = slides.map((s) => `<figure class="slide">${img(s.img, s.alt || s.legenda, { sizes: '(max-width: 768px) 85vw, 360px' })}${s.legenda ? `<figcaption>${esc(s.legenda)}</figcaption>` : ''}</figure>`).join('');
  return `<div class="carrossel" id="${id}" role="region" aria-label="${esc(rotulo)}" data-autoplay="${autoplay ? 'sim' : 'nao'}" data-intervalo="${Number(intervalo) || 3500}">
<div class="trilho" tabindex="0">${itens}</div>
<div class="car-ctrl"><button class="car-seta" data-dir="-1" aria-label="Anterior">${icone('seta', 'ico gira')}</button><span class="car-cont" aria-live="polite">1/${slides.length}</span>${autoplay ? '<button class="car-pausa" aria-label="Pausar">Pausar</button>' : ''}<button class="car-seta" data-dir="1" aria-label="Próximo">${icone('seta')}</button></div>
</div>`;
}
// Vitrine contínua (faixa de materiais rolando, estilo mentoria/Netflix). Sem JS ou com movimento reduzido: rolagem horizontal comum.
function vitrine(rotulo, slides) {
  const fig = (s, oculto) => `<figure class="v-item"${oculto ? ' aria-hidden="true"' : ''}>${img(s.img, oculto ? '' : (s.alt || s.legenda || ''), { sizes: '260px' })}${s.legenda && !oculto ? `<figcaption>${esc(s.legenda)}</figcaption>` : ''}</figure>`;
  return `<div class="vitrine" role="region" aria-label="${esc(rotulo)}"><div class="v-trilho">${slides.map((s) => fig(s, false)).join('')}${slides.map((s) => fig(s, true)).join('')}</div></div>
<p class="v-dica">Toque ou passe o mouse para pausar</p>`;
}

// ---------- seções ----------
const R = {};
R.faixa = () => {
  const p = c.prazoReal;
  if (!p?.texto) return '';
  const futuro = p.fim && new Date(p.fim) > new Date();
  if (p.fim && !futuro) grave('prazoReal.fim já passou: remova a faixa e o cronômetro');
  return `<div class="faixa" data-prazo-real ${p.fixa ? 'data-barra-fixa' : ''}>${esc(p.texto)}${futuro && p.cronometro ? ` <span class="cronometro" data-fim="${esc(p.fim)}" aria-live="off"></span>` : ''}</div>`;
};
R.hero = () => {
  const h = c.hero;
  return `<section class="sec hero escuro"><div class="wrap hero-grid">
${h.selo ? `<div class="hero-selo">${pill(h.selo, 'pill-claro', 'cadeado')}</div>` : ''}
<h1>${rico(h.headline)}</h1><p class="sub">${rico(h.subheadline)}</p>
<div class="hero-img">${img(h.imagem || 'mockup-principal', h.alt || 'Mockup do produto', { prioridade: true })}</div>
${lista(h.itens)}<div class="hero-cta">${btnRolagem(h.botao)}${h.linhaAcesso ? `<p class="acesso">${icone('email', 'ico ico-mini')}${esc(h.linhaAcesso)}</p>` : ''}${h.provaCurta ? `<p class="prova-curta">${esc(h.provaCurta)}</p>` : ''}</div>
</div></section>`;
};
R.dor = () => c.dor?.itens?.length ? secao('', 'dor', `${titulo(c.dor.titulo)}<div class="chips">${c.dor.itens.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`) : '';
R.porDentro = () => {
  const p = c.porDentro;
  if (!p?.slides?.length) return '';
  const corpo = p.estilo === 'vitrine' ? vitrine(p.titulo, p.slides) : carrossel('car-por-dentro', p.titulo, p.slides, p.autoplay, p.intervalo);
  return secao('veja-por-dentro', `por-dentro ${p.estilo === 'vitrine' ? 'escuro largura-total' : 'alt'}`, `${titulo(p.titulo, p.subtitulo)}${corpo}`);
};
R.demo = () => c.demo?.img ? secao('', 'demo', `${c.demo.titulo ? titulo(c.demo.titulo) : ''}${c.demo.texto ? `<p class="demo-txt">${rico(c.demo.texto)}</p>` : ''}<div class="demo-img revelar">${img(c.demo.img, c.demo.alt || '', { sizes: '(max-width: 768px) 92vw, 720px' })}</div>`) : '';
R.paraQuem = () => secao('', 'para-quem', `${titulo(c.paraQuem.titulo)}<div class="grid-cards">${c.paraQuem.itens.map((t) => `<div class="card linha check-card revelar">${icone('check')}<p>${rico(t)}</p></div>`).join('')}</div>`);
R.beneficios = () => secao('', 'beneficios alt', `${titulo(c.beneficios.titulo, c.beneficios.subtitulo)}<div class="grid-cards">${c.beneficios.cards.map((b) => `<div class="card brilho revelar">${icone(b.icone)}<h3>${esc(b.titulo)}</h3><p>${esc(b.texto)}</p></div>`).join('')}</div>${c.beneficios.botao ? `<div class="cta-wrap">${btnRolagem(c.beneficios.botao)}</div>` : ''}`);
R.antesDepois = () => {
  const ad = c.antesDepois;
  if (!ad?.antes?.length) return '';
  if (ad.antes.length !== ad.depois.length) avisos.push('Antes e depois com quantidades diferentes');
  return secao('', 'antes-depois', `${titulo(ad.titulo)}<div class="ad-grid"><div class="card ad antes revelar"><div class="ad-ico">${icone('x')}</div><h3>${esc(ad.rotuloAntes || 'Antes')}</h3>${lista(ad.antes, 'x')}</div><div class="card ad depois revelar"><div class="ad-ico">${icone('check')}</div><h3>${esc(ad.rotuloDepois || 'Depois')}</h3>${lista(ad.depois)}</div></div>`);
};
R.comoFunciona = () => secao('', 'como alt', `${titulo(c.comoFunciona.titulo, c.comoFunciona.subtitulo)}<ol class="passos">${c.comoFunciona.passos.map((p, i) => `<li class="card revelar">${pill(`PASSO ${String(i + 1).padStart(2, '0')}`, 'pill-marca')}<h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></li>`).join('')}</ol>`);
R.prova = () => {
  const pr = c.prova;
  if (!(pr?.depoimentos?.length || pr?.prints?.length)) return '';
  const estrelas = (n) => n ? `<div class="estrelas" aria-label="Nota ${n} de 5">${Array.from({ length: n }, () => icone('estrela', 'ico estrela')).join('')}</div>` : '';
  const corpo = pr.prints?.length ? carrossel('car-prova', pr.titulo, pr.prints) :
    `<div class="grid-cards depos">${pr.depoimentos.map((d) => `<figure class="card depo revelar">${estrelas(d.nota)}<blockquote>${esc(d.texto)}</blockquote><figcaption><strong>${esc(d.nome)}</strong>${d.contexto ? `<span>${esc(d.contexto)}</span>` : ''}</figcaption></figure>`).join('')}</div>`;
  return secao('', 'prova', `${titulo(pr.titulo, pr.subtitulo)}${corpo}${pr.botao ? `<div class="cta-wrap">${btnRolagem(pr.botao)}</div>` : ''}`);
};
R.pitch = () => c.pitch?.texto ? secao('', 'pitch', `<div class="pitch-box revelar"><p class="pitch-titulo">${rico(c.pitch.titulo || '')}</p><p class="pitch-txt">${rico(c.pitch.texto)}</p>${btnRolagem(c.pitch.botao)}</div>`) : '';
R.recebe = () => {
  const r = c.recebe;
  const todosComValor = r.bonus.length > 0 && r.bonus.every((b) => b.valorReal != null);
  if (r.mostrarValorTotal && !todosComValor) avisos.push('valor total ocultado: nem todos os bônus têm valorReal');
  const cards = r.bonus.map((b, i) => `<article class="card bonus brilho revelar"><div class="bonus-img"><span class="etiqueta">BÔNUS #${i + 1}</span>${img(b.img || `mockup-bonus-${i + 1}`, `Mockup do bônus ${b.nome}`, { sizes: '(max-width: 768px) 92vw, 340px' })}</div><div class="bonus-corpo"><h3>${esc(b.nome)}</h3><p>${esc(b.serve)}</p>${b.obstaculo ? `<p class="obstaculo">${icone('lampada', 'ico ico-mini')}<span>${esc(b.obstaculo)}</span></p>` : ''}</div><div class="valor">${b.valorReal != null ? `<span>Valor: <s>${brl(b.valorReal)}</s></span>` : ''}<span class="incluso">INCLUSO</span></div></article>`).join('');
  return secao('o-que-voce-recebe', 'recebe escuro', `${r.pill ? `<div class="centro">${pill(r.pill, 'pill-alerta', 'raio')}</div>` : ''}${titulo(r.titulo)}
<article class="card principal revelar"><div class="principal-img">${img(r.principal.img || 'mockup-principal', `Mockup do ${r.principal.nome}`)}</div><div>${pill('ACESSO IMEDIATO', 'pill-sucesso')}<h3>${esc(r.principal.nome)}</h3>${lista(r.principal.contem)}</div></article>
${r.bonus.length ? `<div class="bonus-intro"><h3 class="transicao">${rico(r.transicao)}</h3>${pill(`${r.bonus.length} ${r.bonus.length > 1 ? 'BÔNUS INCLUSOS' : 'BÔNUS INCLUSO'}`, 'pill-alerta', 'presente')}</div><div class="grid-bonus${r.bonus.length > 4 ? ' muitos' : ''}">${cards}</div>` : ''}
${r.mostrarValorTotal && todosComValor ? `<p class="valor-total">Você leva ${brl(r.bonus.reduce((s, b) => s + b.valorReal, 0))} em bônus junto com o produto.</p>` : ''}`);
};
function blocoPreco({ preco, anterior, parcelas, botao, local, url, plano }) {
  const anteriorOk = anterior != null && preco != null && anterior > preco;
  if (anterior != null && !anteriorOk) avisos.push(`preço anterior ignorado em ${plano || 'oferta'}: precisa ser maior que o preço`);
  return `${anteriorOk ? `<p class="de">De <s>${brl(anterior)}</s> por:</p>` : `<p class="de">Por apenas:</p>`}
<p class="preco">${preco != null ? brl(preco) : 'Preço a definir'}</p>
${parcelas ? `<p class="parcelas">${esc(parcelas)}</p>` : ''}
${anteriorOk ? `<p class="economia">Você economiza ${brl(anterior - preco)}</p>` : ''}
${btnCheckout(botao, local, { url, valor: preco, plano })}
<p class="garantia-linha">${icone('escudo')}${com.garantiaDias ?? '?'} dias de garantia${com.formasPagamento?.length ? ` · ${esc(com.formasPagamento.join(', '))}` : ''}</p>`;
}
R.oferta = () => {
  const o = c.oferta;
  let corpo;
  if (planos) {
    corpo = `<div class="planos">${planos.map((p) => `<article class="card plano${p.destaque ? ' destaque-plano' : ''} revelar">${p.rotulo ? `<div class="centro">${pill(p.rotulo, p.destaque ? 'pill-sucesso' : 'pill-claro')}</div>` : ''}<h3>${esc(p.nome)}</h3>${p.paraQuem ? `<p class="plano-para">${esc(p.paraQuem)}</p>` : ''}${p.img ? `<div class="plano-img">${img(p.img, `Mockup do ${p.nome}`, { sizes: '300px' })}</div>` : ''}${lista(p.itens)}${listaNao(p.naoInclui)}${p.porQueCustaMais ? `<p class="porque">${esc(p.porQueCustaMais)}</p>` : ''}
${blocoPreco({ preco: p.preco, anterior: p.precoAnteriorReal, parcelas: p.parcelamentoTexto, botao: p.botao || o.botao, local: 'oferta', url: p.checkoutUrl, plano: p.id || p.nome })}</article>`).join('')}</div>`;
  } else {
    corpo = `<div class="oferta-card card revelar"><div class="oferta-img">${img(o.img || 'mockup-combo', 'Mockup do produto com os bônus')}</div><div class="oferta-corpo">${lista(o.itens)}
${blocoPreco({ preco: com.preco, anterior: com.precoAnteriorReal, parcelas: com.parcelamentoTexto, botao: o.botao, local: 'oferta' })}</div></div>`;
  }
  return secao('oferta', 'oferta alt', `${o.pill ? `<div class="centro">${pill(o.pill, 'pill-alerta')}</div>` : ''}${titulo(o.titulo, o.subtitulo)}${corpo}${o.justificativa ? `<p class="justificativa revelar">${icone('check')}<span>${rico(o.justificativa)}</span></p>` : ''}`);
};
R.garantia = () => secao('', 'garantia', `<div class="garantia-box"><div class="medalha" aria-hidden="true"><div class="medalha-in"><strong>${com.garantiaDias ?? '?'}</strong><span>DIAS</span></div></div><div><h2>${rico(c.garantia.titulo)}</h2><p>${esc(c.garantia.texto)}</p></div></div>`);
R.faq = () => secao('', 'faq', `${titulo(c.faq.titulo)}<div class="faq-lista">${c.faq.perguntas.map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join('')}</div>`);
R.ctaFinal = () => secao('', 'cta-final escuro', `<p class="cta-frase">${rico(c.ctaFinal.frase)}</p><div class="cta-wrap">${planos ? btnRolagem(c.ctaFinal.botao).replace('#o-que-voce-recebe', '#oferta').replace('data-cta="rolagem"', 'data-cta="rolagem" data-alvo="oferta"') : btnCheckout(c.ctaFinal.botao, 'cta-final')}</div>`);
R.rodape = () => {
  const rd = c.rodape;
  const links = [rd.termosUrl && `<a href="${esc(rd.termosUrl)}">Termos de uso</a>`, rd.privacidadeUrl && `<a href="${esc(rd.privacidadeUrl)}">Política de privacidade</a>`].filter(Boolean).join(' · ');
  return `<footer class="rodape"><div class="wrap"><p>${esc(rd.nome)} · Copyright © ${rd.ano || new Date().getFullYear()} · Todos os direitos reservados.</p><p>Este site não é afiliado à Meta (Facebook e Instagram) nem ao Google.</p>${rd.avisoDireitos ? `<p class="aviso-direitos">${esc(rd.avisoDireitos)}</p>` : ''}${links ? `<p>${links}</p>` : ''}${rd.suporte ? `<p>Suporte: ${esc(rd.suporte)}</p>` : ''}</div></footer>`;
};

// ---------- ordem das seções ----------
const ORDEM_PADRAO = ['faixa', 'hero', 'dor', 'porDentro', 'demo', 'paraQuem', 'beneficios', 'antesDepois', 'comoFunciona', 'prova', 'pitch', 'recebe', 'oferta', 'garantia', 'faq', 'ctaFinal', 'rodape'];
const ordem = Array.isArray(c.ordem) ? c.ordem : ORDEM_PADRAO;
const desconhecidas = ordem.filter((s) => !R[s]);
if (desconhecidas.length) erros.push(`seções desconhecidas em content.ordem: ${desconhecidas.join(', ')}`);
const pos = (s) => ordem.indexOf(s);
for (const obrig of ['hero', 'recebe', 'oferta', 'garantia', 'faq', 'ctaFinal', 'rodape']) if (pos(obrig) < 0) erros.push(`content.ordem sem a seção obrigatória: ${obrig}`);
if (pos('oferta') !== pos('recebe') + 1) erros.push('content.ordem: "oferta" precisa vir logo depois de "recebe"');
if (pos('ctaFinal') < pos('faq')) erros.push('content.ordem: "ctaFinal" precisa vir depois de "faq"');
if (ordem[ordem.length - 1] !== 'rodape') erros.push('content.ordem: "rodape" precisa ser a última');
const S = desconhecidas.length ? [] : ordem.map((s) => R[s]()).filter(Boolean);

// ---------- documento ----------
const vars = Object.entries(tema.cores).map(([k, v]) => `--${k}:${v}`).join(';');
const css = readFileSync(join(RAIZ, 'src', 'styles.css'), 'utf8');
const js = readFileSync(join(RAIZ, 'src', 'app.js'), 'utf8');
const rastreioHead = [
  ras.verificacaoDominio ? `<meta name="facebook-domain-verification" content="${esc(ras.verificacaoDominio)}">` : '',
  ras.pixelId ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(ras.pixelId)}');fbq('track','PageView');</script>` : '',
  ras.clarityId ? `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${esc(ras.clarityId)}");</script>` : '',
].join('\n');
const heroBase = c.hero.imagem || 'mockup-principal';
const heroPreload = existsSync(join(IMG_DIR, `${heroBase}-800.webp`))
  ? `<link rel="preload" as="image" href="img/${heroBase}-800.webp" imagesrcset="img/${heroBase}-400.webp 400w, img/${heroBase}-800.webp 800w" imagesizes="(max-width: 768px) 92vw, 520px" fetchpriority="high">` : '';
const efeitos = Object.entries(tema.efeitos || {}).filter(([, v]) => v).map(([k]) => k).join(' ');
const FLT = { produtoId: ras.produtoId || null, produtoNome: c.recebe?.principal?.nome || c.meta.titulo, valor: planos ? planos[0].preco : com.preco, moeda: com.moeda || 'BRL', pixel: !!ras.pixelId, clarity: !!ras.clarityId };
if (!ras.produtoId) grave('produtoId ausente em src/rastreamento.js (usado em content_ids dos eventos)');

const html = `<!DOCTYPE html>
<html lang="pt-BR" class="${tema.caixaAlta ? 'caixa-alta' : ''}" data-efeitos="${efeitos}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.meta.titulo)}</title>
<meta name="description" content="${esc(c.meta.descricao)}">
${PRODUCAO ? '' : '<meta name="robots" content="noindex, nofollow">'}
${c.meta.urlCanonica ? `<link rel="canonical" href="${esc(c.meta.urlCanonica)}">` : ''}
<meta property="og:title" content="${esc(c.meta.titulo)}">
<meta property="og:description" content="${esc(c.meta.descricao)}">
${c.meta.ogImage ? `<meta property="og:image" content="${esc(c.meta.ogImage)}">` : ''}
<meta name="theme-color" content="${tema.cores['fundo-escuro'] || '#111111'}">
${heroPreload}
${tema.fonteLinks || ''}
<style>:root{${vars};--fonte-titulo:${tema.fonteTitulo};--fonte-texto:${tema.fonteTexto}}
${css}</style>
${rastreioHead}
</head>
<body${c.meta.mockupEstilizado ? ' data-mockup="estilizado"' : ''}>
<main>
${S.join('\n')}
</main>
<script>window.FLT=${JSON.stringify(FLT)};</script>
<script>${js}</script>
</body>
</html>
`;

// ---------- varredura final ----------
const texto = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');
if (PENDENTE.test(texto)) grave('texto pendente ou de exemplo no HTML (DADO A FORNECER, colchetes, lorem ipsum, NOME DO BÔNUS)');
if (/[—–]/.test(texto)) grave('travessão encontrado na copy (— ou –)');
if (URGENCIA.test(texto) && !c.prazoReal?.texto) grave(`urgência sem prazo real: "${texto.match(URGENCIA)[0]}" (preencha content.prazoReal ou remova)`);
if (c.meta.mockupEstilizado && (texto.match(/digital/gi) || []).length < 2) grave('mockup estilizado exige deixar claro que o produto é digital (hero, oferta e FAQ)');

if (erros.length) {
  console.error('BUILD DE PRODUÇÃO BLOQUEADO:\n- ' + [...new Set(erros)].join('\n- '));
  process.exit(1);
}
if (existsSync(SAIDA)) rmSync(SAIDA, { recursive: true });
mkdirSync(join(SAIDA, 'img'), { recursive: true });
if (existsSync(IMG_DIR)) for (const f of readdirSync(IMG_DIR)) if (/\.(webp|avif|png|jpg|ico)$/.test(f)) cpSync(join(IMG_DIR, f), join(SAIDA, 'img', f));
const PUB = join(RAIZ, 'public');
if (existsSync(PUB)) for (const f of readdirSync(PUB)) if (/\.html$/.test(f)) cpSync(join(PUB, f), join(SAIDA, f));
const FONT_DIR = join(RAIZ, 'public', 'fonts');
if (existsSync(FONT_DIR)) { mkdirSync(join(SAIDA, 'fonts'), { recursive: true }); for (const f of readdirSync(FONT_DIR)) if (/\.woff2$/.test(f)) cpSync(join(FONT_DIR, f), join(SAIDA, 'fonts', f)); }
writeFileSync(join(SAIDA, 'index.html'), html);
console.log(`OK ${PRODUCAO ? 'produção' : 'prévia'}: dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB) · estilo ${tema.nome || 'personalizado'}`);
if (avisos.length) console.log('Avisos:\n- ' + [...new Set(avisos)].join('\n- '));
