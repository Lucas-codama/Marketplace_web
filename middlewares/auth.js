function requisicaoEsperaJson(req) {
  const accept = req.get('accept') || '';

  return (
    req.xhr ||
    req.originalUrl.startsWith('/api/') ||
    accept.includes('application/json')
  );
}

function exigirLogin(req, res, next) {
  if (req.session?.usuario) {
    return next();
  }

  if (requisicaoEsperaJson(req)) {
    return res.status(401).json({
      erro: 'Autenticação necessária.'
    });
  }

  req.session.redirecionarDepoisDoLogin =
    req.originalUrl;

  return res.redirect('/login');
}

function exigirPapel(...papeisPermitidos) {
  return function verificarPapel(req, res, next) {
    if (!req.session?.usuario) {
      if (requisicaoEsperaJson(req)) {
        return res.status(401).json({
          erro: 'Autenticação necessária.'
        });
      }

      return res.redirect('/login');
    }

    const papelAtual = req.session.usuario.papel;

    if (!papeisPermitidos.includes(papelAtual)) {
      if (requisicaoEsperaJson(req)) {
        return res.status(403).json({
          erro: 'Você não possui permissão para esta operação.'
        });
      }

      res.status(403);

      return res.renderComLayout('erros/403', {
        titulo: 'Acesso negado'
      });
    }

    return next();
  };
}

export {
  exigirLogin,
  exigirPapel,
  requisicaoEsperaJson
};