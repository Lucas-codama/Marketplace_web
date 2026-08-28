$(function configurarCarrinho() {

  const $mensagem = $('#mensagemCarrinho');

  function falha(xhr) { 
    NXT.mensagem($mensagem[0], xhr.responseJSON?.erro || 'Não foi possível atualizar o carrinho.', 'danger'); 
  }

  function atualizar(carrinho) { 
    $('#contadorCarrinho, #quantidadeCarrinho').text(carrinho.quantidadeTotal); 
    $('#valorTotalCarrinho').text(NXT.moeda(carrinho.valorTotal)); 
  }

  $('.js-form-adicionar-carrinho').on('submit', function adicionar(evento) { 

    evento.preventDefault(); const $form = $(this); 
    const $botao = $form.find('button').prop('disabled', true); 

    $.ajax({ 
      url: '/api/carrinho/itens', 
      method: 'POST', 
      contentType: 'application/json', 
      data: JSON.stringify({ 
        produtoId: $form.data('produto-id'), 
        quantidade: $form.find('[name="quantidade"]').val() 
      })}).done((dados) => { atualizar(dados.carrinho); 
        NXT.mensagem($mensagem[0], dados.mensagem); 
      }).fail(falha).always(() => $botao.prop('disabled', false)); });

  $('.js-quantidade-carrinho').on('change', function alterar() { 

    const $input = $(this); 
    const $linha = $input.closest('.js-item-carrinho'); 

    $.ajax({ url: `/api/carrinho/itens/${$linha.data('item-id')}`, 
      method: 'PATCH', 
      contentType: 'application/json', 
      data: JSON.stringify({ 
        quantidade: $input.val() }) 
      }).done((dados) => { 
        const item = dados.carrinho.itens.find((atual) => atual.id === Number($linha.data('item-id'))); 
        if (item) $linha.find('.js-subtotal-item').text(NXT.moeda(item.subtotal)); 
        atualizar(dados.carrinho); 
      }).fail(falha); });

  $('.js-remover-item').on('click', function remover() { 
    const $linha = $(this).closest('.js-item-carrinho'); 
    const proximoFoco = $linha.next('.js-item-carrinho').find('.js-remover-item')[0]
      || $linha.prev('.js-item-carrinho').find('.js-remover-item')[0]
      || document.querySelector('a[href="/checkout"]');
    $.ajax({ 
      url: `/api/carrinho/itens/${$linha.data('item-id')}`, 
      method: 'DELETE' 
    }).done((dados) => { $linha.fadeOut(180, () => {
      $linha.remove();
      proximoFoco?.focus();
    });

    atualizar(dados.carrinho); 
  
    if (!dados.carrinho.itens.length) window.setTimeout(() => window.location.reload(), 220); }).fail(falha); });
});
