import { UniqueConstraintError, ValidationError } from 'sequelize';
import { Usuario } from '../models/index.js';

function texto(valor) {
  return String(valor || '').trim();
}

function definirSessao(req, usuario) {
  req.session.usuario = {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    username: usuario.username,
    papel: usuario.papel
  };
}

async function exibirPerfil(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.usuarioAtual.id);
    return res.renderComLayout('perfil/index',{
        titulo: 'Minha conta',
        usuarioPerfil: usuario,
        errosPerfil: [],
        errosSenha: []
      }
    );
  } catch (erro) {
    return next(erro);
  }
}

async function atualizarPerfil(req, res, next) {
  const nomeCompleto = texto(req.body.nomeCompleto);
  const username = texto(req.body.username).toLowerCase();
  const email = texto(req.body.email).toLowerCase();
  const erros = [];

  if (nomeCompleto.length < 3) {
    erros.push('Informe seu nome completo.');
  }

  if (username.length < 3 || username.length > 30) {
    erros.push('O username deve possuir entre 3 e 30 caracteres.');
  }

  if (!/^[a-z0-9._-]+$/i.test(username)) {
    erros.push('O username contém caracteres inválidos.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.push('Informe um e-mail válido.');
  }

  if (erros.length > 0) {
    res.status(422);
    return res.renderComLayout('perfil/index',{
        titulo: 'Minha conta',
        usuarioPerfil: {
          ...req.usuarioAtual.toJSON(),
          nomeCompleto,
          username,
          email
        },
        errosPerfil: erros,
        errosSenha: []
      }
    );
  }

  try {
    const usuario = await Usuario.findByPk(req.usuarioAtual.id);
    await usuario.update({
      nomeCompleto,
      username,
      email
    });
    definirSessao(req, usuario);
    req.definirFlash('success', 'Dados da conta atualizados.');
    return res.redirect('/perfil');

  } catch (erro) {
    if (erro instanceof UniqueConstraintError) {
      res.status(409);
      return res.renderComLayout('perfil/index',{
          titulo: 'Minha conta',
          usuarioPerfil: {
            ...req.usuarioAtual.toJSON(),
            nomeCompleto,
            username,
            email
          },
          errosPerfil: ['O username ou e-mail já está em uso.'],
          errosSenha: []
        }
      );
    }

    if (erro instanceof ValidationError) {
      res.status(422);
      return res.renderComLayout('perfil/index',{
          titulo: 'Minha conta',
          usuarioPerfil: req.usuarioAtual,
          errosPerfil: erro.errors.map((item) => item.message),
          errosSenha: []
        }
      );
    }
    return next(erro);
  }
}

async function alterarSenha(req, res, next) {
  const senhaAtual = String(req.body.senhaAtual || '');
  const novaSenha = String(req.body.novaSenha || '');
  const confirmarNovaSenha = String(req.body.confirmarNovaSenha || '');
  const erros = [];

  if (!senhaAtual) {
    erros.push('Informe sua senha atual.');
  }

  if (novaSenha.length < 8) {
    erros.push('A nova senha deve possuir pelo menos 8 caracteres.');
  }

  if (novaSenha !== confirmarNovaSenha) {
    erros.push('A confirmação da nova senha não corresponde.');
  }

  try {
    const usuario = await Usuario.scope('comSenha').findByPk(req.usuarioAtual.id);
    if (usuario && senhaAtual && !(await usuario.validarSenha(senhaAtual))) {
      erros.push('A senha atual está incorreta.');
    }

    if (erros.length > 0) {
      res.status(422);

      return res.renderComLayout('perfil/index',{
          titulo: 'Minha conta',
          usuarioPerfil: req.usuarioAtual,
          errosPerfil: [],
          errosSenha: erros
        }
      );
    }

    await usuario.update({password: novaSenha});
    definirSessao(req, usuario);
    req.definirFlash('success', 'Senha alterada com sucesso.');
    return res.redirect('/perfil');
    
  } catch (erro) {
    return next(erro);
  }
}

export {
  exibirPerfil,
  atualizarPerfil,
  alterarSenha
};