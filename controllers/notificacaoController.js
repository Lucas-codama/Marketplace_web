import { Notificacao } from '../models/index.js';

async function listar(req, res, next) {
  try {
    return res.renderComLayout('notificacoes/index', {
      titulo: 'Notificações',
      notificacoes: await Notificacao.findAll({ where: { usuarioId: req.usuarioAtual.id }, order: [['createdAt', 'DESC']] })
    });
  } catch (erro) {
    return next(erro);
  }
}

async function contar(req, res, next) {
  try {
    return res.json({ quantidade: await Notificacao.count({ where: { usuarioId: req.usuarioAtual.id, lida: false } }) });
  } catch (erro) {
    return next(erro);
  }
}

async function marcar(req, res, next) {
  try {
    const notificacao = await Notificacao.findOne({ where: { id: req.params.id, usuarioId: req.usuarioAtual.id } });
    if (!notificacao) return res.status(404).json({ erro: 'Notificação não encontrada.' });
    await notificacao.update({ lida: true });
    return res.json({ mensagem: 'Notificação lida.' });
  } catch (erro) {
    return next(erro);
  }
}

async function marcarTodas(req, res, next) {
  try {
    await Notificacao.update({ lida: true }, { where: { usuarioId: req.usuarioAtual.id } });
    return res.json({ mensagem: 'Todas as notificações foram lidas.' });
  } catch (erro) {
    return next(erro);
  }
}

export { listar, contar, marcar, marcarTodas };
