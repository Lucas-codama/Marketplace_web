function flashMiddleware(req, res, next) {
  res.locals.flash = req.session.flash || null;

  delete req.session.flash;

  req.definirFlash = function definirFlash(
    tipo,
    mensagem
  ) {
    req.session.flash = {
      tipo,
      mensagem
    };
  };

  next();
}

export {
  flashMiddleware
};