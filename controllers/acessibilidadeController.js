function pagina(req, res, next) {
  try {
    return res.renderComLayout('acessibilidade/index', {
      titulo: 'Acessibilidade'
    });
  } catch (erro) {
    return next(erro);
  }
}

export { pagina };
