$(function configurarNotificacoes() {
  const $contador = $('#contadorNotificacoes');
  function atualizar() {
    if (!$contador.length) return;
    $.getJSON('/api/notificacoes/nao-lidas')
      .done((dados) => $contador.text(dados.quantidade).toggleClass('d-none', !dados.quantidade))
      .fail(() => $contador.addClass('d-none'));
  }
  $('.js-marcar-lida').on('click', function marcar() {
    const $botao = $(this);
    const $card = $botao.closest('[data-notificacao-id]');
    $.ajax({ url: `/api/notificacoes/${$card.data('notificacao-id')}/lida`, method: 'PATCH' }).done(() => {
      $card.removeClass('is-unread').addClass('is-read');
      $botao.remove();
      atualizar();
    });
  });
  $('#marcarTodasLidas').on('click', () =>
    $.ajax({ url: '/api/notificacoes/marcar-todas/lidas', method: 'PATCH' }).done(() => {
      $('.notification-card').removeClass('is-unread').addClass('is-read');
      $('.js-marcar-lida').remove();
      atualizar();
    })
  );
  atualizar();
  window.NXTAtualizarNotificacoes = atualizar;
});
