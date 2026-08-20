$(function configurarAdmin() {

  $('.js-status').on('click', function alterar() {
    const $botao = $(this).prop('disabled', true);
    const chave = $botao.data('key') || 'status';
    $.ajax({ url: $botao.data('url'), method: 'PATCH', contentType: 'application/json', data: JSON.stringify({ [chave]: $botao.data('status') }) })
      .done(() => window.location.reload())
      .fail((xhr) => {
        window.alert(xhr.responseJSON?.erro || 'Não foi possível alterar.');
        $botao.prop('disabled', false);
      });
  });
  
  $('.js-select-status').on('change', function alterar() {
    const $select = $(this).prop('disabled', true);
    $.ajax({ url: $select.data('url'), method: 'PATCH', contentType: 'application/json', data: JSON.stringify({ [$select.data('key')]: $select.val() }) })
      .done(() => window.location.reload())
      .fail((xhr) => {
        window.alert(xhr.responseJSON?.erro || 'Não foi possível alterar.');
        $select.prop('disabled', false);
      });
  });
});
