$(function configurarAvaliacoes() {
  const $area = $('#avaliacoesProduto');
  if ($area.length)
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
        $card.append($topo, $('<div>', { class: 'stars' }).text(`${'★'.repeat(item.nota)}${'☆'.repeat(5 - item.nota)}`), $('<p>').text(item.comentario));
        $lista.append($card);
      });
      if (!dados.avaliacoes.length) $lista.append($('<p>', { class: 'text-secondary', text: 'Este produto ainda não possui avaliações.' }));
    });
    
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
