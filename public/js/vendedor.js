$(function configurarVendedor() {
  const $aviso = $('#mensagemVendedor');

  $('.js-salvar-estoque').on('click', function salvar() {
    const $botao = $(this).prop('disabled', true);
    const $linha = $botao.closest('[data-produto-id]');
    $.ajax({
      url: `/api/vendedor/produtos/${$linha.data('produto-id')}/estoque`,
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ estoque: $linha.find('.js-estoque').val() })
    })
      .done((dados) => NXT.mensagem($aviso[0], dados.mensagem))
      .fail((xhr) => NXT.mensagem($aviso[0], xhr.responseJSON?.erro || 'Não foi possível atualizar.', 'danger'))
      .always(() => $botao.prop('disabled', false));
  });

  $('#formEstadoPedido').on('submit', function atualizarPedido(evento) {
    evento.preventDefault();
    const $form = $(this);
    const dados = Object.fromEntries(new FormData(this));
    $.ajax({ url: `/api/vendedor/pedidos/${$form.data('pedido-id')}/estado`, method: 'PATCH', contentType: 'application/json', data: JSON.stringify(dados) })
      .done((resposta) => {
        NXT.mensagem($aviso[0], resposta.mensagem);
        $('.js-estado-item').text(dados.estado.replaceAll('_', ' '));
      })
      .fail((xhr) => NXT.mensagem($aviso[0], xhr.responseJSON?.erro || 'Não foi possível alterar o pedido.', 'danger'));
  });
  
  const $imagem = $('#imagem');
  $imagem.on('change', function visualizar() {
    const arquivo = this.files?.[0];
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    $('.js-preview-imagem').attr('src', url).removeClass('d-none');
  });
});
