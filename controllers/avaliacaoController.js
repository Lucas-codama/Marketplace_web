import { Produto } from '../models/index.js';
import { ErroAvaliacao, criarAvaliacao, itensAvaliaveis, listarAvaliacoes } from '../services/avaliacaoService.js';

async function apiListar(req, res, next) {
  try {
    const resultado = await listarAvaliacoes(req.params.id);
    return res.json({
      resumo: resultado.resumo,
      avaliacoes: resultado.avaliacoes.map((item) => ({ id: item.id, nota: item.nota, comentario: item.comentario, criadaEm: item.createdAt, cliente: item.cliente }))
    });
  } catch (erro) {
    return next(erro);
  }
}

async function formulario(req, res, next) {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) return res.status(404).renderComLayout('erros/404', { titulo: 'Produto não encontrado' });
    return res.renderComLayout('avaliacoes/formulario', { 
      titulo: 'Avaliar produto', 
      produto, 
      itens: await itensAvaliaveis(req.usuarioAtual.id, produto.id) 
    });
  } catch (erro) {
    return next(erro);
  }
}

async function apiCriar(req, res, next) {
  try {
    const avaliacao = await criarAvaliacao(req.usuarioAtual.id, req.params.id, req.body);
    return res.status(201).json({ 
      mensagem: 'Avaliação enviada para moderação.', 
      avaliacao 
    });
  } catch (erro) {
    if (erro instanceof ErroAvaliacao) return res.status(erro.status).json({ erro: erro.message });
    return next(erro);
  }
}

export { 
  apiListar, 
  formulario, 
  apiCriar 
};
