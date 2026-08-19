(function configurarTempoReal() {
  if (typeof io === 'undefined') return;
  const socket = io();
  const produto = document.querySelector('[data-acompanhar-produto]');
  if (produto) socket.emit('acompanhar_produto', produto.dataset.acompanharProduto);
  socket.on('estoque_atualizado', (dados) => {
    if (!produto || Number(produto.dataset.acompanharProduto) !== Number(dados.produtoId)) return;
    const estoque = document.querySelector('.js-estoque-produto');
    if (estoque) estoque.textContent = dados.estoque;
  });
  ['nova_venda', 'pedido_atualizado', 'nova_notificacao'].forEach((evento) => socket.on(evento, () => window.NXTAtualizarNotificacoes?.()));
})();
