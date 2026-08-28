(function configurarTempoReal() {
  if (typeof io === 'undefined') return;
  const socket = io();
  const produto = document.querySelector('[data-acompanhar-produto]');
  if (produto) socket.emit('acompanhar_produto', produto.dataset.acompanharProduto);

  function notificacoesPausadas() {
    return document.documentElement.getAttribute('data-notificacoes-pausadas') === '1';
  }

  function marcarAtualizacaoPendente() {
    const botaoManual = document.getElementById('atualizarNotificacoesManual');
    if (botaoManual) botaoManual.dataset.pendente = '1';
  }

  socket.on('estoque_atualizado', (dados) => {
    if (!produto || Number(produto.dataset.acompanharProduto) !== Number(dados.produtoId)) return;
    if (notificacoesPausadas()) {
      marcarAtualizacaoPendente();
      return;
    }
    const estoque = document.querySelector('.js-estoque-produto');
    if (estoque) estoque.textContent = dados.estoque;
  });

  ['nova_venda', 'pedido_atualizado', 'nova_notificacao'].forEach((evento) =>
    socket.on(evento, () => {
      if (notificacoesPausadas()) {
        marcarAtualizacaoPendente();
        return;
      }
      window.NXTAtualizarNotificacoes?.();
    })
  );

  const botaoManual = document.getElementById('atualizarNotificacoesManual');
  if (botaoManual) {
    botaoManual.addEventListener('click', () => {
      window.NXTAtualizarNotificacoes?.();
      delete botaoManual.dataset.pendente;
    });
  }
})();
