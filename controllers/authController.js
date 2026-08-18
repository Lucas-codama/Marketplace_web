import {
  Op,
  UniqueConstraintError,
  ValidationError
} from 'sequelize';

import { Usuario } from '../models/index.js';

function texto(valor) {
  return String(valor || '').trim();
}

function destinoPorPapel(papel) {
  if (papel === "admin") {
    return '/admin';
  }

  return '/';
}

function destinoSeguro(destino) {
  return (typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//'));
}

function regenerarSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) {
        reject(erro)
        return;
      }

      resolve();
    });
  });
}

function salvarSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.save((erro) => {
      if (erro) {
        reject(erro)
        return;
      }

      resolve();
    });
  });
}

function dadosDaSessao(usuario) {
  return {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    username: usuario.username,
    papel: usuario.papel,
  };
}

function renderizarCadastro(res, {erros = [], valores = {}} = {}, status = 200) {
  res.status(status);

  return res.renderComLayout('auth/cadastro', {
    titulo: 'Cadastro',
    erros,
    valores
  });
}

function renderizarLogin(res, {erros = [], valores = {}} = {}, status = 200) {
  res.status(status);

  return res.renderComLayout('auth/login', {
    titulo: 'Login',
    erros,
    valores
  });
}

function validarCadastro({nomeCompleto, username, email, password, confirmarPassword}) {
  const erros = [];

  if (nomeCompleto.length < 3) {
    erros.push('informe seu nome completo.');
  }

  if (username.length < 3 || username.length > 30) {
    erros.push('informe um nome de usuário entre 3 e 30 caracteres.');
  }

  if (username && !/^[a-z0-9_]+$/i.test(username)) {
    erros.push('o nome de usuário só pode conter letras, números e sublinhados.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.push('informe um endereço de e-mail válido.');
  }

  if (password.length < 8) {
    erros.push('informe uma senha com pelo menos 8 caracteres.');
  }

  if (password !== confirmarPassword) {
    erros.push('as senhas não coincidem.');
  }

  return erros;
}

function exibirCadastro(req, res) {
  if (req.usuarioAtual) {
    return res.redirect('/perfil');
  }

  return renderizarCadastro(res);
}

async function cadastrar(req, res, next) {
  const nomeCompleto = texto(req.body.nomeCompleto);

  const username = texto(req.body.username).toLowerCase();

  const email = texto(req.body.email).toLowerCase();

  const password = String(req.body.password || '');

  const confirmarPassword = String(req.body.confirmarPassword || '');

  const valores = {
    nomeCompleto,
    username,
    email
  };

  const erros = validarCadastro({
    nomeCompleto,
    username,
    email,
    password,
    confirmarPassword
  });

  if (erros.length > 0) {
    return renderizarCadastro(res, {erros, valores}, 422);
  }

  try {
    const usuarioExistente = await Usuario.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });

    if (usuarioExistente) {
      return renderizarCadastro(res,{
          erros: [
            'O username ou e-mail informado já está em uso.'
          ],
          valores
        }, 409
      );
    }

    await Usuario.create({
      nomeCompleto,
      username,
      email,
      password,
      papel: 'cliente',
      status: 'ativo'
    });

    req.definirFlash('success', 'Cadastro realizado. Agora você já pode entrar.'
    );

    return res.redirect('/login');

  } catch (erro) {
    if (erro instanceof UniqueConstraintError) {
      return renderizarCadastro(res, {
          erros: [
            'O username ou e-mail informado já está em uso.'
          ],
          valores
        }, 409
      );
    }

    if (erro instanceof ValidationError) {
      return renderizarCadastro(res, {
          erros: erro.errors.map((item) => item.message),
          valores
        }, 422
      );
    }

    return next(erro);
  }
}

function exibirLogin(req, res) {
  if (req.usuarioAtual) {
    return res.redirect(
      destinoPorPapel(req.usuarioAtual.papel)
    );
  }

  return renderizarLogin(res);
}

async function autenticar(req, res, next) {
  const identificador = texto(req.body.identificador).toLowerCase();
  const password = String(req.body.password || '');
  const valores = { identificador };

  if (!identificador || !password) {
    return renderizarLogin(res, {
        erros: ['Informe seu username ou e-mail e a senha.'],
        valores
      }, 422
    );
  }

  try {
    const usuario = await Usuario.scope('comSenha').findOne({
          where: {
            [Op.or]: [
              {
                username: identificador
              },
              {
                email: identificador
              }
            ]
          }
        });

    if (!usuario) {
      return renderizarLogin(res, {
          erros: ['Usuário ou senha inválidos.'],
          valores
        },401
      );
    }

    const senhaCorreta = await usuario.validarSenha(password);

    if (!senhaCorreta) {
      return renderizarLogin(res, {
          erros: ['Usuário ou senha inválidos.'],
          valores
        },401
      );
    }

    if (usuario.status !== 'ativo') {
      return renderizarLogin(res,{
          erros: ['Esta conta está bloqueada.'],
          valores
        },403
      );
    }

    const redirecionarDepoisDoLogin = req.session.redirecionarDepoisDoLogin;
    await regenerarSessao(req);
    req.session.usuario = dadosDaSessao(usuario);
    await usuario.update({ultimoLoginEm: new Date()});
    await salvarSessao(req);

    if (destinoSeguro(redirecionarDepoisDoLogin)) {
      return res.redirect(redirecionarDepoisDoLogin);
    }

    return res.redirect(destinoPorPapel(usuario.papel));

  } catch (erro) {
    return next(erro);
  }
}

function sair(req, res, next) {
  req.session.destroy((erro) => {
    if (erro) {
      next(erro);
      return;
    }

    res.clearCookie('nxtplay.sid');
    res.redirect('/');
  });
}

export {
  exibirCadastro,
  cadastrar,
  exibirLogin,
  autenticar,
  sair
};