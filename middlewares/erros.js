function requisicaoEsperaJson(req) {
  const accept = req.get('accept') || '';

  return (
    req.xhr ||
    req.originalUrl.startsWith('/api/') ||
    accept.includes('application/json')
  );
}

function naoEncontrado(req, res) {
  if (requisicaoEsperaJson(req)) {
    return res.status(404).json({
      erro: 'Recurso não encontrado.'
    });
  }

  res.status(404);

  return res.renderComLayout('erros/404', {
    titulo: 'Página não encontrada'
  });
}

function tratarErro(erro, req, res, next) {
  if (res.headersSent) {
    return next(erro);
  }

  console.error(erro);

  const status = erro.status || 500;

  if (requisicaoEsperaJson(req)) {
    return res.status(status).json({
      erro:
        status === 500
          ? 'Ocorreu um erro interno no servidor.'
          : erro.message
    });
  }

  res.status(status);

  return res.renderComLayout('erros/500', {
    titulo: 'Erro interno',
    mensagem:
      process.env.NODE_ENV === 'development'
        ? erro.message
        : 'Não foi possível concluir a operação.'
  });
}

export {
  naoEncontrado,
  tratarErro
};