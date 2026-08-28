import { Produto } from '../models/index.js';

async function produtoDoVendedor(req, res, next) {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) {
      if (req.originalUrl.startsWith('/api/')) return res.status(404).json({ erro: 'Produto não encontrado.' });
      return res.status(404).renderComLayout('erros/404', { titulo: 'Produto não encontrado' });
    }
    if (produto.vendedorId !== req.usuarioAtual.id) {
      if (req.originalUrl.startsWith('/api/')) return res.status(403).json({ erro: 'Este produto pertence a outro vendedor.' });
      return res.status(403).renderComLayout('erros/403', { titulo: 'Acesso negado', mensagem: 'Este produto pertence a outro vendedor.' });
    }
    req.produtoDoVendedor = produto;
    return next();
  } catch (erro) {
    return next(erro);
  }
}

export { produtoDoVendedor };
