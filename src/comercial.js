// Dados financeiros reais (decisão do usuário em 17/11/2026). Nada de segredo aqui.
export default {
  preco: 37.99,            // exibido = cadastro + taxa da Cakto
  precoCadastro: 37,
  taxaCheckout: 0.99,
  moeda: 'BRL',
  precoAnteriorReal: null,
  parcelamentoTexto: null, // conferir no checkout da Cakto antes de exibir
  garantiaDias: 7,
  formasPagamento: ['Pix', 'Cartão de crédito'],
  checkoutUrl: 'https://pay.cakto.com.br/uwvawdt_1351597', // Cakto, criado em 20/11/2026
  planos: null,
};
