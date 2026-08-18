import { Op } from 'sequelize';
import { Avaliacao, Categoria, PerfilVendedor, Produto, Usuario } from '../models/index.js';
import { buscarDetalheProduto, consultarCatalogo } from '../services/catalogoService.js';

async function listarCatalogo(req, res, next) {
  try {
    const [resultado, categorias, vendedores] = await Promise.all([
      consultarCatalogo(req.query),
      Categoria.findAll({ where: { ativa: true }, order: [['nome', 'ASC']] }),
      Usuario.findAll({ where: { papel: 'vendedor', status: 'ativo' }, attributes: ['id', 'nomeCompleto', 'username'], include: [{ model: PerfilVendedor, as: 'perfilVendedor', required: false }] })
    ]);
    if (req.get('accept')?.includes('application/json') || req.query.formato === 'json') return res.json({ ...resultado, produtos: resultado.produtos.map((produto) => produto.toJSON()) });
    return res.renderComLayout('catalogo/index', { titulo: 'Catálogo', ...resultado, categorias, vendedores, filtros: req.query });
  } catch (erro) { return next(erro); }
}

async function detalharProduto(req, res, next) {
  try {
    const produto = await buscarDetalheProduto(req.params.id);
    if (!produto) return res.status(404).renderComLayout('erros/404', { titulo: 'Produto não encontrado' });
    const relacionados = await Produto.findAll({ where: { categoriaId: produto.categoriaId, estado: 'ativo', id: { [Op.ne]: produto.id } }, limit: 4, order: [['createdAt', 'DESC']] });
    const media = produto.avaliacoes.length ? produto.avaliacoes.reduce((soma, item) => soma + item.nota, 0) / produto.avaliacoes.length : 0;
    return res.renderComLayout('produtos/detalhes', { titulo: produto.nome, produto, relacionados, media });
  } catch (erro) { return next(erro); }
}

async function perfilPublicoVendedor(req, res, next) {
  try {
    const perfil = await PerfilVendedor.findOne({ where: { slug: req.params.slug, ativo: true }, include: [{ model: Usuario, as: 'usuario', where: { status: 'ativo' }, attributes: ['id', 'nomeCompleto', 'username'], include: [{ model: Produto, as: 'produtosVenda', where: { estado: 'ativo' }, required: false, include: [{ model: Categoria, as: 'categoria' }] }] }] });
    if (!perfil) return res.status(404).renderComLayout('erros/404', { titulo: 'Vendedor não encontrado' });
    return res.renderComLayout('vendedores/perfil', { titulo: perfil.nomeLoja, perfil, produtos: perfil.usuario.produtosVenda });
  } catch (erro) { return next(erro); }
}

export { listarCatalogo, detalharProduto, perfilPublicoVendedor };
