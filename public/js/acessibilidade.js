(function iniciarAcessibilidade() {
  const CHAVE = 'nxtplay:acessibilidade';
  const ESCALA_MIN = 0.85;
  const ESCALA_MAX = 1.4;
  const ESCALA_PASSO = 0.1;
  const ESCALA_PADRAO = 1;

  function obterPreferencias() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) || '{}');
      return {
        altoContraste: Boolean(salvo.altoContraste),
        escalaFonte: typeof salvo.escalaFonte === 'number' ? salvo.escalaFonte : ESCALA_PADRAO
      };
    } catch (erro) {
      return { altoContraste: false, escalaFonte: ESCALA_PADRAO };
    }
  }

  function salvarPreferencias(preferencias) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(preferencias));
    } catch (erro) {
      /* localStorage indisponível: preferências não serão persistidas nesta sessão. */
    }
  }

  function aplicarPreferencias(preferencias) {
    document.documentElement.classList.toggle('alto-contraste', preferencias.altoContraste);
    document.documentElement.style.setProperty('--fonte-escala', preferencias.escalaFonte);
  }

  let preferencias = obterPreferencias();
  aplicarPreferencias(preferencias);

  function atualizarInterface() {
    const chaveContraste = document.getElementById('acessibilidadeContraste');
    const valorEscala = document.getElementById('acessibilidadeEscalaValor');
    if (chaveContraste) chaveContraste.checked = preferencias.altoContraste;
    if (valorEscala) valorEscala.textContent = `${Math.round(preferencias.escalaFonte * 100)}%`;
  }

  document.addEventListener('DOMContentLoaded', () => {
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
      });
    }

    if (botaoDiminuir) {
      botaoDiminuir.addEventListener('click', () => {
        preferencias.escalaFonte = Math.max(ESCALA_MIN, Number((preferencias.escalaFonte - ESCALA_PASSO).toFixed(2)));
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
      });
    }

    if (botaoAumentar) {
      botaoAumentar.addEventListener('click', () => {
        preferencias.escalaFonte = Math.min(ESCALA_MAX, Number((preferencias.escalaFonte + ESCALA_PASSO).toFixed(2)));
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
      });
    }

    if (botaoRestaurar) {
      botaoRestaurar.addEventListener('click', () => {
        preferencias = { altoContraste: false, escalaFonte: ESCALA_PADRAO };
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
      });
    }
  });

  window.NXTAcessibilidade = { obterPreferencias, aplicarPreferencias };
})();
