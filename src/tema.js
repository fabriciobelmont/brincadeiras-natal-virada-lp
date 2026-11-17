// Design system do 04-blueprint-pagina.md v1: identidade do próprio PDF.
import { estilo } from './estilos.js';

const titulo = "'Bricolage Grotesque', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const texto = "'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export default estilo('mentoria-chocolate-creme', {
  cores: {
    'cor-marca': '#1B6B47', 'cor-pill': '#C8102E', 'cor-cta': '#C8102E', 'cor-cta-texto': '#FFFFFF',
    'cor-sucesso': '#16803C', 'cor-destaque': '#1B6B47', 'cor-destaque-escuro': '#F5C451',
    'texto': '#1E1A19', 'texto-suave': '#5E5652', 'texto-claro': '#FFF8EF',
    'fundo': '#FFF8EF', 'fundo-alt': '#FCEBDC', 'fundo-card': '#FFFFFF', 'fundo-escuro': '#12372A', 'fundo-escuro-2': '#0E2C21',
    'borda': '#EADFD2', 'antes-fundo': '#FDECEC', 'antes-cor': '#C81E1E', 'selo-ouro': '#C9A227',
    'raio-card': '16px', 'raio-btn': '12px', 'sombra': '0 8px 24px rgba(30,26,25,.08)',
  },
  fonteTitulo: titulo,
  fonteTexto: texto,
  caixaAlta: false,
  efeitos: { brilhoCards: true, revelar: true, vidro: false },
  fonteLinks: '<link rel="preload" href="fonts/bricolage-800.woff2" as="font" type="font/woff2" crossorigin>',
});
