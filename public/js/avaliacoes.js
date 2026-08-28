$(function configurarAvaliacoes() {
  const $area = $('#avaliacoesProduto');
  if ($area.length) {
    $('#listaAvaliacoes').attr('aria-busy', 'true');
    $.getJSON(`/api/produtos/${$area.data('produto-id')}/avaliacoes`).done((dados) => {
      $('#mediaAvaliacoes').text(Number(dados.resumo.media).toFixed(1));
      $('#quantidadeAvaliacoes').text(`${dados.resumo.quantidade} avaliações`);
      const $lista = $('#listaAvaliacoes').empty();
      dados.avaliacoes.forEach((item) => {
        const $card = $('<article>', { class: 'review-card' });
        const $topo = $('<div>', { class: 'review-head' }).append(
          $('<strong>').text(item.cliente.nomeCompleto),
          $('<small>').text(new Date(item.criadaEm).toLocaleDateString('pt-BR'))
        );
        const $estrelas = $('<div>', {
          class: 'stars',
          role: 'img',
          'aria-label': `${item.nota} de 5 estrelas`
        }).text(`${'★'.repeat(item.nota)}${'☆'.repeat(5 - item.nota)}`);
        $card.append($topo, $estrelas, $('<p>').text(item.comentario));
        $lista.append($card);
      });
      if (!dados.avaliacoes.length) $lista.append($('<p>', { class: 'text-secondary', text: 'Este produto ainda não possui avaliações.' }));
    }).fail(() => {
      NXT.mensagem($('#listaAvaliacoes')[0], 'Não foi possível carregar as avaliações.', 'danger');
    }).always(() => $('#listaAvaliacoes').removeAttr('aria-busy'));
  }
    
  $('#formAvaliacao').on('submit', function enviar(evento) {
    evento.preventDefault();
    const $form = $(this);
    const dados = Object.fromEntries(new FormData(this));
    $.ajax({ url: `/api/produtos/${$form.data('produto-id')}/avaliacoes`, method: 'POST', contentType: 'application/json', data: JSON.stringify(dados) })
      .done((resposta) => {
        NXT.mensagem($('#mensagemAvaliacao')[0], resposta.mensagem);
        $form[0].reset();
      })
      .fail((xhr) => NXT.mensagem($('#mensagemAvaliacao')[0], xhr.responseJSON?.erro || 'Não foi possível enviar a avaliação.', 'danger'));

  });
});
