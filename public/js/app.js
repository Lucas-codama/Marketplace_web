(function iniciarNxtPlay() {
  const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  let contadorIds = 0;

  async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, { headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(opcoes.headers || {}) }, ...opcoes });
    const tipo = resposta.headers.get('content-type') || '';
    const dados = tipo.includes('application/json') ? await resposta.json() : { erro: 'A sessão pode ter expirado.' };
    if (!resposta.ok) throw new Error(dados.erro || dados.mensagem || 'Não foi possível concluir a operação.');
    return dados;
  }
  function mensagem(elemento, texto, tipo = 'success') {
    if (!elemento) return;
    const aviso = document.createElement('div');
    aviso.className = `alert alert-${tipo}`;
    aviso.setAttribute('role', tipo === 'danger' ? 'alert' : 'status');
    aviso.setAttribute('aria-atomic', 'true');
    aviso.textContent = texto;
    elemento.replaceChildren(aviso);

    if (tipo === 'danger') {
      aviso.tabIndex = -1;
      aviso.focus();
    }
  }

  function garantirId(controle) {
    if (!controle.id) {
      contadorIds += 1;
      controle.id = `campo-${contadorIds}`;
    }
    return controle.id;
  }

  function mensagemDeErro(controle) {
    const { validity } = controle;
    if (validity.valueMissing) return controle.type === 'radio' || controle.type === 'checkbox' ? 'Selecione uma opção.' : 'Preencha este campo.';
    if (validity.typeMismatch) return controle.type === 'email' ? 'Informe um endereço de e-mail válido.' : 'Informe um valor no formato esperado.';
    if (validity.patternMismatch) return 'Use o formato solicitado para este campo.';
    if (validity.tooShort) return `Use pelo menos ${controle.minLength} caracteres.`;
    if (validity.tooLong) return `Use no máximo ${controle.maxLength} caracteres.`;
    if (validity.rangeUnderflow) return `Informe um valor maior ou igual a ${controle.min}.`;
    if (validity.rangeOverflow) return `Informe um valor menor ou igual a ${controle.max}.`;
    if (validity.stepMismatch || validity.badInput) return 'Informe um número válido.';
    return 'Revise este campo.';
  }

  function controlesDoMesmoGrupo(controle) {
    if (controle.type !== 'radio' || !controle.name || !controle.form) return [controle];
    return [...controle.form.elements].filter((item) => item.type === 'radio' && item.name === controle.name);
  }

  function marcarCampoInvalido(controle) {
    const grupo = controlesDoMesmoGrupo(controle);
    const referencia = grupo[0];
    const idErro = `${garantirId(referencia)}-erro`;
    let erro = document.getElementById(idErro);

    grupo.forEach((item) => {
      item.setAttribute('aria-invalid', 'true');
      const descricoes = new Set((item.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      descricoes.add(idErro);
      item.setAttribute('aria-describedby', [...descricoes].join(' '));
    });

    if (!erro) {
      erro = document.createElement('span');
      erro.id = idErro;
      erro.className = 'field-error';
      const destino = referencia.type === 'radio'
        ? referencia.closest('.rating-options')
        : referencia.closest('.password-field') || referencia;
      destino.insertAdjacentElement('afterend', erro);
    }
    erro.textContent = mensagemDeErro(controle);
  }

  function limparCampoInvalido(controle) {
    const grupo = controlesDoMesmoGrupo(controle);
    const referencia = grupo[0];
    const idErro = referencia.id ? `${referencia.id}-erro` : '';
    const grupoValido = referencia.type !== 'radio' || grupo.some((item) => item.checked);
    if (!grupoValido || !controle.validity.valid) return;

    grupo.forEach((item) => {
      item.removeAttribute('aria-invalid');
      if (!idErro) return;
      const descricoes = (item.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== idErro);
      if (descricoes.length) item.setAttribute('aria-describedby', descricoes.join(' '));
      else item.removeAttribute('aria-describedby');
    });
    if (idErro) document.getElementById(idErro)?.remove();
  }

  document.addEventListener('invalid', (evento) => {
    evento.preventDefault();
    marcarCampoInvalido(evento.target);
    window.setTimeout(() => evento.target.form?.querySelector('[aria-invalid="true"]')?.focus(), 0);
  }, true);

  document.addEventListener('input', (evento) => {
    if (evento.target.matches('input, select, textarea')) limparCampoInvalido(evento.target);
  });

  document.addEventListener('change', (evento) => {
    if (evento.target.matches('input, select, textarea')) limparCampoInvalido(evento.target);
  });

  document.querySelectorAll('[data-password-toggle]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const campo = document.getElementById(botao.getAttribute('aria-controls'));
      if (!campo) return;
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      botao.textContent = mostrar ? 'Ocultar senha' : 'Mostrar senha';
      botao.setAttribute('aria-pressed', String(mostrar));
    });
  });

  document.querySelectorAll('.table-shell[tabindex="0"], .table-responsive[tabindex="0"]').forEach((regiao) => {
    regiao.addEventListener('keydown', (evento) => {
      // Controles dentro da tabela preservam seu comportamento de teclado nativo.
      if (evento.target !== regiao || regiao.scrollWidth <= regiao.clientWidth) return;

      const pagina = Math.max(80, Math.round(regiao.clientWidth * 0.8));
      const comandos = {
        ArrowLeft: () => regiao.scrollBy({ left: -80 }),
        ArrowRight: () => regiao.scrollBy({ left: 80 }),
        PageUp: () => regiao.scrollBy({ left: -pagina }),
        PageDown: () => regiao.scrollBy({ left: pagina }),
        Home: () => regiao.scrollTo({ left: 0 }),
        End: () => regiao.scrollTo({ left: regiao.scrollWidth })
      };
      const executar = comandos[evento.key];
      if (!executar) return;

      evento.preventDefault();
      executar();
    });
  });

  document.querySelectorAll('[data-confirmar]').forEach((form) =>
    form.addEventListener('submit', (evento) => {
      if (!window.confirm(form.dataset.confirmar)) evento.preventDefault();
    })
  );
  window.NXT = { moeda, requisicao, mensagem };
})();
