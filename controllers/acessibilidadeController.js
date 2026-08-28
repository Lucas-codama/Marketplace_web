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

  if (Number.isNaN(escalaFonte) || escalaFonte < 0.85 || escalaFonte > 2) {
    return res.status(422).json({ erro: 'Informe uma escala de fonte entre 85% e 200%.' });
  }

  try {
    await req.usuarioAtual.update({ altoContraste, escalaFonte });
    return res.json({ altoContraste, escalaFonte });
  } catch (erro) {
    return next(erro);
  }
}

export { pagina, salvarPreferencias };
