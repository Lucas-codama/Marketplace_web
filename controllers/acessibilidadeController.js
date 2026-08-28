const REGEX_COR_HEX = /^#[0-9a-f]{6}$/i;

function normalizarCor(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const cor = String(valor).trim();
  return REGEX_COR_HEX.test(cor) ? cor.toLowerCase() : undefined;
}

function pagina(req, res, next) {
  try {
    return res.renderComLayout('acessibilidade/index', {
      titulo: 'Acessibilidade'
    });
  } catch (erro) {
    return next(erro);
  }
}

async function salvarPreferencias(req, res, next) {
  const altoContraste = Boolean(req.body.altoContraste);
  const escalaFonte = Number(req.body.escalaFonte);
  const notificacoesPausadas = Boolean(req.body.notificacoesPausadas);

  if (Number.isNaN(escalaFonte) || escalaFonte < 0.85 || escalaFonte > 2) {
    return res.status(422).json({ erro: 'Informe uma escala de fonte entre 85% e 200%.' });
  }

  const corTexto = normalizarCor(req.body.corTexto);
  const corFundo = normalizarCor(req.body.corFundo);

  if (corTexto === undefined || corFundo === undefined) {
    return res.status(422).json({ erro: 'Informe cores no formato hexadecimal, por exemplo #112233.' });
  }

  // Cores personalizadas e alto contraste sao mutuamente exclusivos:
  // ativar um mecanismo desliga o outro para nao conflitarem visualmente.
  const usarCoresPersonalizadas = Boolean(corTexto || corFundo);

  try {
    await req.usuarioAtual.update({
      altoContraste: usarCoresPersonalizadas ? false : altoContraste,
      escalaFonte,
      corTexto: usarCoresPersonalizadas ? corTexto : null,
      corFundo: usarCoresPersonalizadas ? corFundo : null,
      notificacoesPausadas
    });

    return res.json({
      altoContraste: usarCoresPersonalizadas ? false : altoContraste,
      escalaFonte,
      corTexto: usarCoresPersonalizadas ? corTexto : null,
      corFundo: usarCoresPersonalizadas ? corFundo : null,
      notificacoesPausadas
    });
  } catch (erro) {
    return next(erro);
  }
}

export { pagina, salvarPreferencias };
