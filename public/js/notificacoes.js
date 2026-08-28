$(function configurarNotificacoes() {
  const $contador = $('#contadorNotificacoes');
  const $status = $('#statusNotificacoes');

  function anunciar(texto) {
    $status.text('');
    window.requestAnimationFrame(() => $status.text(texto));
  }

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
      $card.find('.js-estado-notificacao').text('Lida');
      $botao.remove();
      anunciar('Notificação marcada como lida.');
      atualizar();
    }).fail(() => anunciar('Não foi possível marcar a notificação como lida.'));
  });
  $('#marcarTodasLidas').on('click', () =>
    $.ajax({ url: '/api/notificacoes/marcar-todas/lidas', method: 'PATCH' }).done(() => {
      $('.notification-card').removeClass('is-unread').addClass('is-read');
      $('.js-estado-notificacao').text('Lida');
      $('.js-marcar-lida').remove();
      anunciar('Todas as notificações foram marcadas como lidas.');
      atualizar();
    }).fail(() => anunciar('Não foi possível marcar todas as notificações como lidas.'))
  );
  atualizar();
  window.NXTAtualizarNotificacoes = atualizar;
});
