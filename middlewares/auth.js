import { Usuario } from '../models/index.js';

function requisicaoEsperaJson(req) {
  const accept = req.get('accept') || '';

  return (
    req.xhr ||
    req.originalUrl.startsWith('/api/') ||
    accept.includes('application/json')
  );
}

function destruirSessao(req) {
  return new Promise((resolve) => {
    if (!req.session) {
      resolve();
      return;
    }

    req.session.destroy(() => {
      resolve();
    });
  });
}

async function carregarUsuarioDaSessao(req, res, next) {
  res.locals.usuario = null;
  req.usuarioAtual = null;
  const usuarioDaSessao = req.session?.usuario;

  if (!usuarioDaSessao?.id) {
    return next();
  }

  try {
    const usuario = await Usuario.findByPk(usuarioDaSessao.id);

    if (!usuario) {
      await destruirSessao(req);
      res.clearCookie('nxtplay.sid');
      return next();
    }

    if (usuario.status !== 'ativo') {
      await destruirSessao(req);
      res.clearCookie('nxtplay.sid');
      if (requisicaoEsperaJson(req)) {
        return res.status(403).json({erro: 'Esta conta está bloqueada.'});
      }

      res.status(403);

      return res.renderComLayout('erros/403',{
          titulo: 'Conta bloqueada',
          mensagem: 'Sua conta está bloqueada e não pode acessar áreas privadas.'
        }
      );
    }

    req.usuarioAtual = usuario;

    req.session.usuario = {
      id: usuario.id,
      nomeCompleto: usuario.nomeCompleto,
      username: usuario.username,
      papel: usuario.papel
    };

    res.locals.usuario = usuario.toJSON();
    return next();

  } catch (erro) {
    return next(erro);
  }
}

function exigirLogin(req, res, next) {
  if (req.usuarioAtual) {
    return next();
  }

  if (requisicaoEsperaJson(req)) {
    return res.status(401).json({
      erro: 'Autenticação necessária.'
    });
  }

  if (req.method === 'GET' && req.session) {
    req.session.redirecionarDepoisDoLogin = req.originalUrl;
  }

  return res.redirect('/login');
}

function exigirPapel(...papeisPermitidos) {
  return function verificarPapel(req, res, next) {
    if (!req.usuarioAtual) {
      if (requisicaoEsperaJson(req)) {
        return res.status(401).json({
          erro: 'Autenticação necessária.'
        });
      }

      return res.redirect('/login');
    }

    const papelAtual = req.usuarioAtual.papel;

    if (!papeisPermitidos.includes(papelAtual)) {
      if (requisicaoEsperaJson(req)) {
        return res.status(403).json({
          erro: 'Você não possui permissão para esta operação.'
        });
      }

      res.status(403);

      return res.renderComLayout('erros/403', {
        titulo: 'Acesso negado',
        mensagem: 'Você não possui permissão para acessar esta área.'
      });
    }

    return next();
  };
}

export {
  carregarUsuarioDaSessao,
  exigirLogin,
  exigirPapel,
  requisicaoEsperaJson
};