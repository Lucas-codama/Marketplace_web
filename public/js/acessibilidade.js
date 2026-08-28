(function iniciarAcessibilidade() {
  const ESCALA_MIN = 0.85;
  const ESCALA_MAX = 1.4;
  const ESCALA_PASSO = 0.1;
  const ESCALA_PADRAO = 1;

  const html = document.documentElement;
  const usuarioLogado = html.hasAttribute('data-alto-contraste');

  function obterPreferencias() {
    if (usuarioLogado) {
      return {
        altoContraste: html.getAttribute('data-alto-contraste') === '1',
        escalaFonte: Number(html.getAttribute('data-escala-fonte')) || ESCALA_PADRAO
      };
    }
    // Visitante sem login: nunca lê nada salvo, sempre começa no padrão.
    return { altoContraste: false, escalaFonte: ESCALA_PADRAO };
  }

  function salvarPreferencias(preferencias) {
    // Sem login, nada é persistido — é só uma prévia na página atual.
    if (!usuarioLogado) return;

    html.setAttribute('data-alto-contraste', preferencias.altoContraste ? '1' : '0');
    html.setAttribute('data-escala-fonte', String(preferencias.escalaFonte));

    fetch('/api/acessibilidade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencias)
    }).catch(() => anunciar('A preferência foi aplicada, mas não pôde ser salva na sua conta.'));
  }

  function aplicarPreferencias(preferencias) {
    html.classList.toggle('alto-contraste', preferencias.altoContraste);
    html.style.setProperty('--fonte-escala', preferencias.escalaFonte);

  }

  let preferencias = obterPreferencias();
  aplicarPreferencias(preferencias);

  function anunciar(texto) {
    const status = document.getElementById('acessibilidadeStatus');
    if (!status) return;
    status.textContent = '';
    window.requestAnimationFrame(() => { status.textContent = texto; });
  }

  function atualizarInterface() {
    const chaveContraste = document.getElementById('acessibilidadeContraste');
    const valorEscala = document.getElementById('acessibilidadeEscalaValor');
    const botaoDiminuir = document.getElementById('acessibilidadeDiminuir');
    const botaoAumentar = document.getElementById('acessibilidadeAumentar');
    if (chaveContraste) chaveContraste.checked = preferencias.altoContraste;
    if (valorEscala) valorEscala.textContent = `${Math.round(preferencias.escalaFonte * 100)}%`;
    if (botaoDiminuir) botaoDiminuir.disabled = preferencias.escalaFonte <= ESCALA_MIN;
    if (botaoAumentar) botaoAumentar.disabled = preferencias.escalaFonte >= ESCALA_MAX;
  }

  function iniciarControles() {
    const chaveContraste = document.getElementById('acessibilidadeContraste');
    const botaoDiminuir = document.getElementById('acessibilidadeDiminuir');
    const botaoAumentar = document.getElementById('acessibilidadeAumentar');
    const botaoRestaurar = document.getElementById('acessibilidadeRestaurar');

    atualizarInterface();

    if (chaveContraste) {
      chaveContraste.addEventListener('change', () => {
        preferencias.altoContraste = chaveContraste.checked;
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        anunciar(`Alto contraste ${preferencias.altoContraste ? 'ativado' : 'desativado'}.`);
      });
    }

    if (botaoDiminuir) {
      botaoDiminuir.addEventListener('click', () => {
        preferencias.escalaFonte = Math.max(ESCALA_MIN, Number((preferencias.escalaFonte - ESCALA_PASSO).toFixed(2)));
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
        anunciar(`Tamanho da fonte: ${Math.round(preferencias.escalaFonte * 100)}%.`);
      });
    }

    if (botaoAumentar) {
      botaoAumentar.addEventListener('click', () => {
        preferencias.escalaFonte = Math.min(ESCALA_MAX, Number((preferencias.escalaFonte + ESCALA_PASSO).toFixed(2)));
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
        anunciar(`Tamanho da fonte: ${Math.round(preferencias.escalaFonte * 100)}%.`);
      });
    }

    if (botaoRestaurar) {
      botaoRestaurar.addEventListener('click', () => {
        preferencias = { altoContraste: false, escalaFonte: ESCALA_PADRAO };
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
        anunciar('Preferências de acessibilidade restauradas.');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarControles);
  } else {
    iniciarControles();
  }

  window.NXTAcessibilidade = { obterPreferencias, aplicarPreferencias };
})();
