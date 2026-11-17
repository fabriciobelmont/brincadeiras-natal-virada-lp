// Biblioteca de estilos (design systems) da fábrica.
// Origem: páginas de alta conversão da mentoria (guitarra, guitarra v2, luminárias CNC, antes e depois)
// e prints de referência visual do POP. Cores de botão ajustadas para contraste AA (texto branco >= 4,5:1).
// Uso em tema.js: import { estilo } from './estilos.js'; export default estilo('mentoria-chocolate-creme', { cores: { ... } });

const base = {
  'cor-cta-texto': '#FFFFFF',
  'texto': '#1C1C1C',
  'texto-suave': '#5A5A5A',
  'texto-claro': '#F7F7F5',
  'fundo': '#FFFFFF',
  'borda': '#E5E1DA',
  'antes-fundo': '#FDECEC',
  'antes-cor': '#C81E1E',
  'selo-ouro': '#C9A227',
  'raio-card': '16px',
  'raio-btn': '10px',
  'sombra': '0 8px 24px rgba(0,0,0,.08)',
};

const sistema = "system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const serifa = "Georgia,'Times New Roman',serif";

export const ESTILOS = {
  // Mentoria · guitarra: hero escuro, destaques em vermelho, botão verde, seções claras rosadas
  'mentoria-noite-vermelha': {
    cores: { ...base, 'cor-marca': '#C81E2B', 'cor-pill': '#E11D2E', 'cor-cta': '#16803C', 'cor-sucesso': '#16803C', 'cor-destaque': '#D61F2C',
      'fundo-alt': '#FBF4F2', 'fundo-escuro': '#141414', 'fundo-escuro-2': '#2A0B0B' },
    fonteTitulo: sistema, fonteTexto: sistema, caixaAlta: false, efeitos: { brilhoCards: true, revelar: true },
  },
  // Mentoria · guitarra v2: preto e branco com destaque azul, botão laranja
  'mentoria-azul-confianca': {
    cores: { ...base, 'cor-marca': '#1D3FD8', 'cor-pill': '#E11D2E', 'cor-cta': '#C2410C', 'cor-sucesso': '#16803C', 'cor-destaque': '#1D3FD8',
      'fundo-alt': '#F3F4F6', 'fundo-escuro': '#0B0B0F', 'fundo-escuro-2': '#13224A' },
    fonteTitulo: sistema, fonteTexto: sistema, caixaAlta: false, efeitos: { brilhoCards: true, revelar: true },
  },
  // Mentoria · luminárias CNC: chocolate, creme e coral, títulos em caixa alta pesada, botão verde
  'mentoria-chocolate-creme': {
    cores: { ...base, 'cor-marca': '#3B1F14', 'cor-pill': '#D9482F', 'cor-cta': '#16803C', 'cor-sucesso': '#16803C', 'cor-destaque': '#D9482F',
      'fundo-alt': '#F8E9CF', 'fundo-rosa': '#FBE3DF', 'fundo-escuro': '#3B1F14', 'fundo-escuro-2': '#2A140C', 'borda': '#E9D9BC' },
    fonteTitulo: sistema, fonteTexto: sistema, caixaAlta: true, efeitos: { brilhoCards: true, revelar: true },
  },
  // Print AgentAI: preto absoluto, vermelho neon com brilho, cards de vidro
  'neon-vermelho-premium': {
    cores: { ...base, 'cor-marca': '#FF2D2D', 'cor-pill': '#FF2D2D', 'cor-cta': '#B91C1C', 'cor-sucesso': '#16803C', 'cor-destaque': '#FF4D4D',
      'texto': '#F2F2F2', 'texto-suave': '#B8B8B8', 'fundo': '#0A0A0A', 'fundo-alt': '#141414', 'fundo-escuro': '#000000', 'fundo-escuro-2': '#1A0505', 'borda': '#2A2A2A',
      'sombra': '0 0 0 1px rgba(255,45,45,.15), 0 10px 40px rgba(255,45,45,.12)' },
    fonteTitulo: sistema, fonteTexto: sistema, caixaAlta: false, efeitos: { brilhoCards: true, revelar: true, vidro: true },
  },
  // Print gastronomia: fundo escuro quente, âmbar, títulos com serifa
  'gourmet-escuro': {
    cores: { ...base, 'cor-marca': '#F28C28', 'cor-pill': '#C2410C', 'cor-cta': '#C2410C', 'cor-sucesso': '#16803C', 'cor-destaque': '#F28C28',
      'texto': '#F3EDE6', 'texto-suave': '#BFB6AA', 'fundo': '#121212', 'fundo-alt': '#1C1A18', 'fundo-escuro': '#0C0B0A', 'fundo-escuro-2': '#241A10', 'borda': '#2E2A25' },
    fonteTitulo: serifa, fonteTexto: sistema, caixaAlta: false, efeitos: { brilhoCards: true, revelar: true },
  },
  // Print NEONMORPHIC: gradiente roxo, magenta, vidro
  'neon-roxo-glass': {
    cores: { ...base, 'cor-marca': '#FF3B8D', 'cor-pill': '#FF3B8D', 'cor-cta': '#BE185D', 'cor-sucesso': '#16803C', 'cor-destaque': '#FF6FAE',
      'texto': '#F5F0FA', 'texto-suave': '#C9BBD8', 'fundo': '#1A0B2E', 'fundo-alt': '#23103B', 'fundo-escuro': '#12071F', 'fundo-escuro-2': '#3A0F3F', 'borda': '#3B2357' },
    fonteTitulo: sistema, fonteTexto: sistema, caixaAlta: false, efeitos: { brilhoCards: true, revelar: true, vidro: true },
  },
  // Oficina organizada: petróleo e laranja (exemplo original)
  'oficina-petroleo': {
    cores: { ...base, 'cor-marca': '#1F4E79', 'cor-pill': '#C2410C', 'cor-cta': '#C2410C', 'cor-sucesso': '#1E7B45', 'cor-destaque': '#C2410C',
      'fundo-alt': '#F4F2EE', 'fundo-escuro': '#14212E', 'fundo-escuro-2': '#1F3347' },
    fonteTitulo: sistema, fonteTexto: sistema, caixaAlta: false, efeitos: { brilhoCards: false, revelar: true },
  },
};

export function estilo(nome, ajustes = {}) {
  const e = ESTILOS[nome];
  if (!e) throw new Error(`estilo desconhecido: ${nome}. Opções: ${Object.keys(ESTILOS).join(', ')}`);
  return {
    nome,
    cores: { ...e.cores, ...(ajustes.cores || {}) },
    fonteTitulo: ajustes.fonteTitulo || e.fonteTitulo,
    fonteTexto: ajustes.fonteTexto || e.fonteTexto,
    caixaAlta: ajustes.caixaAlta ?? e.caixaAlta,
    efeitos: { ...e.efeitos, ...(ajustes.efeitos || {}) },
    fonteLinks: ajustes.fonteLinks || '',
  };
}
