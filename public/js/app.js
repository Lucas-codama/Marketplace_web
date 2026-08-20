(function iniciarNxtPlay() {
  const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, { headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(opcoes.headers || {}) }, ...opcoes });
    const tipo = resposta.headers.get('content-type') || '';
    const dados = tipo.includes('application/json') ? await resposta.json() : { erro: 'A sessão pode ter expirado.' };
    if (!resposta.ok) throw new Error(dados.erro || dados.mensagem || 'Não foi possível concluir a operação.');
    return dados;
  }
  function mensagem(elemento, texto, tipo = 'success') {
    if (!elemento) return;
    elemento.innerHTML = `<div class="alert alert-${tipo}">${texto}</div>`;
  }
  document.querySelectorAll('[data-confirmar]').forEach((form) =>
    form.addEventListener('submit', (evento) => {
      if (!window.confirm(form.dataset.confirmar)) evento.preventDefault();
    })
  );
  document.querySelectorAll('.js-flash').forEach((alerta) => window.setTimeout(() => bootstrap.Alert.getOrCreateInstance(alerta).close(), 5000));
  window.NXT = { moeda, requisicao, mensagem };
})();
