(function iniciarAcessibilidade() {
  const ESCALA_MIN = 0.85;
  const ESCALA_MAX = 2;
  const ESCALA_PASSO = 0.1;
  const ESCALA_PADRAO = 1;
  const CHAVE_ARMAZENAMENTO = 'nxtplay:acessibilidade';

  const html = document.documentElement;
  const usuarioLogado = html.hasAttribute('data-alto-contraste');

  function normalizarPreferencias(valor = {}) {
    const escalaInformada = Number(valor.escalaFonte);
    const escalaFonte = Number.isFinite(escalaInformada)
      ? Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escalaInformada))
      : ESCALA_PADRAO;

    return {
      altoContraste: valor.altoContraste === true,
      escalaFonte,
      corTexto: typeof valor.corTexto === 'string' ? valor.corTexto : '',
      corFundo: typeof valor.corFundo === 'string' ? valor.corFundo : '',
      notificacoesPausadas: valor.notificacoesPausadas === true
    };
  }

  function obterPreferenciasLocais() {
    try {
      return normalizarPreferencias(JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || '{}'));
    } catch (erro) {
      return normalizarPreferencias();
    }
  }

  function obterPreferencias() {
    if (usuarioLogado) {
      return normalizarPreferencias({
        altoContraste: html.getAttribute('data-alto-contraste') === '1',
        escalaFonte: Number(html.getAttribute('data-escala-fonte')) || ESCALA_PADRAO,
        corTexto: html.getAttribute('data-cor-texto') || '',
        corFundo: html.getAttribute('data-cor-fundo') || '',
        notificacoesPausadas: html.getAttribute('data-notificacoes-pausadas') === '1'
      });
    }

    return obterPreferenciasLocais();
  }

  function salvarPreferencias(preferencias) {
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(preferencias));
    } catch (erro) {}

    if (!usuarioLogado) return;

    html.setAttribute('data-alto-contraste', preferencias.altoContraste ? '1' : '0');
    html.setAttribute('data-escala-fonte', String(preferencias.escalaFonte));
    html.setAttribute('data-cor-texto', preferencias.corTexto || '');
    html.setAttribute('data-cor-fundo', preferencias.corFundo || '');
    html.setAttribute('data-notificacoes-pausadas', preferencias.notificacoesPausadas ? '1' : '0');

    fetch('/api/acessibilidade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(preferencias)
    }).catch(() => anunciar('A preferência foi aplicada, mas não pôde ser salva na sua conta.'));
  }

  function aplicarPreferencias(preferencias) {
    html.classList.toggle('alto-contraste', preferencias.altoContraste);
    html.style.setProperty('--fonte-escala', preferencias.escalaFonte);

    const temCoresPersonalizadas = Boolean(preferencias.corTexto || preferencias.corFundo);
    html.classList.toggle('cores-personalizadas', temCoresPersonalizadas);
    if (preferencias.corTexto) html.style.setProperty('--ink', preferencias.corTexto);
    else html.style.removeProperty('--ink');
    if (preferencias.corFundo) html.style.setProperty('--paper', preferencias.corFundo);
    else html.style.removeProperty('--paper');

    const botaoManual = document.getElementById('atualizarNotificacoesManual');
    if (botaoManual) botaoManual.classList.toggle('d-none', !preferencias.notificacoesPausadas);
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
    const campoCorTexto = document.getElementById('acessibilidadeCorTexto');
    const campoCorFundo = document.getElementById('acessibilidadeCorFundo');
    const chaveNotificacoes = document.getElementById('acessibilidadePausarNotificacoes');

    if (chaveContraste) chaveContraste.checked = preferencias.altoContraste;
    if (valorEscala) valorEscala.textContent = `${Math.round(preferencias.escalaFonte * 100)}%`;
    if (botaoDiminuir) botaoDiminuir.disabled = preferencias.escalaFonte <= ESCALA_MIN;
    if (botaoAumentar) botaoAumentar.disabled = preferencias.escalaFonte >= ESCALA_MAX;
    if (campoCorTexto) campoCorTexto.value = preferencias.corTexto || '#10120e';
    if (campoCorFundo) campoCorFundo.value = preferencias.corFundo || '#f3f4ed';
    if (chaveNotificacoes) chaveNotificacoes.checked = preferencias.notificacoesPausadas;
  }

  function iniciarControles() {
    const chaveContraste = document.getElementById('acessibilidadeContraste');
    const botaoDiminuir = document.getElementById('acessibilidadeDiminuir');
    const botaoAumentar = document.getElementById('acessibilidadeAumentar');
    const botaoRestaurar = document.getElementById('acessibilidadeRestaurar');
    const campoCorTexto = document.getElementById('acessibilidadeCorTexto');
    const campoCorFundo = document.getElementById('acessibilidadeCorFundo');
    const botaoAplicarCores = document.getElementById('acessibilidadeAplicarCores');
    const botaoLimparCores = document.getElementById('acessibilidadeLimparCores');
    const chaveNotificacoes = document.getElementById('acessibilidadePausarNotificacoes');

    atualizarInterface();

    if (chaveContraste) {
      chaveContraste.addEventListener('change', () => {
        preferencias.altoContraste = chaveContraste.checked;
        if (preferencias.altoContraste) {
          // Alto contraste e cores personalizadas são mutuamente exclusivos.
          preferencias.corTexto = '';
          preferencias.corFundo = '';
        }
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
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

    if (botaoAplicarCores) {
      botaoAplicarCores.addEventListener('click', () => {
        preferencias.corTexto = campoCorTexto ? campoCorTexto.value : '';
        preferencias.corFundo = campoCorFundo ? campoCorFundo.value : '';
        preferencias.altoContraste = false;
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
        anunciar('Cores de texto e de fundo personalizadas aplicadas.');
      });
    }

    if (botaoLimparCores) {
      botaoLimparCores.addEventListener('click', () => {
        preferencias.corTexto = '';
        preferencias.corFundo = '';
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        atualizarInterface();
        anunciar('Cores personalizadas removidas.');
      });
    }

    if (chaveNotificacoes) {
      chaveNotificacoes.addEventListener('change', () => {
        preferencias.notificacoesPausadas = chaveNotificacoes.checked;
        aplicarPreferencias(preferencias);
        salvarPreferencias(preferencias);
        anunciar(`Atualizações em tempo real ${preferencias.notificacoesPausadas ? 'pausadas' : 'reativadas'}.`);
      });
    }

    if (botaoRestaurar) {
      botaoRestaurar.addEventListener('click', () => {
        preferencias = normalizarPreferencias();
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

  window.addEventListener('storage', (evento) => {
    if (evento.key !== CHAVE_ARMAZENAMENTO) return;
    preferencias = obterPreferenciasLocais();
    aplicarPreferencias(preferencias);
    atualizarInterface();
    anunciar(`Preferências atualizadas em outra aba. Tamanho da fonte: ${Math.round(preferencias.escalaFonte * 100)}%.`);
  });

  window.NXTAcessibilidade = { obterPreferencias, aplicarPreferencias };
})();
