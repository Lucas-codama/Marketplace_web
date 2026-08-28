import { UniqueConstraintError, ValidationError } from 'sequelize';
import { PerfilVendedor, Usuario } from '../models/index.js';

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
    const usuario = await Usuario.findByPk(req.usuarioAtual.id, { include: [{ model: PerfilVendedor, as: 'perfilVendedor', required: false }] });
    return res.renderComLayout('perfil/index',{
        titulo: 'Minha conta',
        usuarioPerfil: usuario,
        errosPerfil: [],
        errosSenha: [],
        perfilVendedor: usuario.perfilVendedor
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
    erros.push('Informe seu nome completo com pelo menos 3 caracteres.');
  }

  if (username.length < 3 || username.length > 30) {
    erros.push('Informe um nome de usuário entre 3 e 30 caracteres.');
  }

  if (!/^[a-z0-9_]+$/i.test(username)) {
    erros.push('Use somente letras, números e sublinhados no nome de usuário.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.push('Informe um e-mail válido, como nome@exemplo.com.');
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
        errosSenha: [],
        perfilVendedor: null
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
          errosPerfil: ['O nome de usuário ou e-mail já está em uso. Escolha outro nome de usuário ou informe outro e-mail.'],
          errosSenha: [],
          perfilVendedor: null
        }
      );
    }

    if (erro instanceof ValidationError) {
      res.status(422);
      return res.renderComLayout('perfil/index',{
          titulo: 'Minha conta',
          usuarioPerfil: req.usuarioAtual,
          errosPerfil: erro.errors.map((item) => item.message),
          errosSenha: [],
          perfilVendedor: null
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
    erros.push('Digite a mesma senha nos campos Nova senha e Confirmar nova senha.');
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
          errosSenha: erros,
          perfilVendedor: null
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

async function atualizarPerfilVendedor(req, res, next) {
  try {
    const perfil = await PerfilVendedor.findOne({ where: { usuarioId: req.usuarioAtual.id } });
    if (!perfil) return res.status(404).renderComLayout('erros/404', { titulo: 'Perfil de vendedor não encontrado' });
    const nomeLoja = texto(req.body.nomeLoja); const slug = texto(req.body.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    await perfil.update({ nomeLoja, slug, descricao: texto(req.body.descricao) || null, cidade: texto(req.body.cidade) || null, uf: texto(req.body.uf).toUpperCase() || null });
    req.definirFlash('success', 'Perfil público da loja atualizado.'); return res.redirect('/perfil');
  } catch (erro) {
    if (erro instanceof UniqueConstraintError || erro instanceof ValidationError) { req.definirFlash('danger', erro.errors?.[0]?.message || 'Revise os dados da loja.'); return res.redirect('/perfil'); }
    return next(erro);
  }
}

export {
  exibirPerfil,
  atualizarPerfil,
  alterarSenha,
  atualizarPerfilVendedor
};
