import { Op } from 'sequelize';
import { Avaliacao, Categoria, PerfilVendedor, Produto, Usuario } from '../models/index.js';

function numero(valor) {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : null;
}

async function consultarCatalogo(query = {}) {
  const pagina = Math.max(Number(query.pagina) || 1, 1);
  const limite = 12;
  const where = { estado: 'ativo' };
  const busca = String(query.busca || '').trim();
  const categoriaId = numero(query.categoria);
  const vendedorId = numero(query.vendedor);
  const precoMin = numero(query.precoMin);
  const precoMax = numero(query.precoMax);

  if (busca) where[Op.or] = [{ nome: { [Op.like]: `%${busca}%` } }, { descricao: { [Op.like]: `%${busca}%` } }];
  if (categoriaId) where.categoriaId = categoriaId;
  if (vendedorId) where.vendedorId = vendedorId;
  if (precoMin !== null || precoMax !== null) where.preco = { ...(precoMin !== null ? { [Op.gte]: precoMin } : {}), ...(precoMax !== null ? { [Op.lte]: precoMax } : {}) };
  if (query.disponivel === '1') where.estoque = { [Op.gt]: 0 };

  const ordens = {
    'menor-preco': [['preco', 'ASC']],
    'maior-preco': [['preco', 'DESC']],
    nome: [['nome', 'ASC']],
    recentes: [['createdAt', 'DESC']]
  };

  const resultado = await Produto.findAndCountAll({
    where,
    include: [
      { model: Categoria, as: 'categoria', where: { ativa: true } },
      { model: Usuario, as: 'vendedor', attributes: ['id', 'nomeCompleto', 'username'], include: [{ model: PerfilVendedor, as: 'perfilVendedor', required: false }] }
    ],
    order: ordens[query.ordem] || ordens.recentes,
    limit: limite,
    offset: (pagina - 1) * limite,
    distinct: true
  });

  return { produtos: resultado.rows, total: resultado.count, pagina, totalPaginas: Math.max(Math.ceil(resultado.count / limite), 1) };
}

async function buscarDetalheProduto(id) {
  return Produto.findOne({
    where: { id, estado: 'ativo' },
    include: [
      { model: Categoria, as: 'categoria' },
      { model: Usuario, as: 'vendedor', attributes: ['id', 'nomeCompleto', 'username'], include: [{ model: PerfilVendedor, as: 'perfilVendedor', required: false }] },
      { model: Avaliacao, as: 'avaliacoes', where: { estado: 'aprovada' }, required: false, include: [{ model: Usuario, as: 'cliente', attributes: ['nomeCompleto', 'username'] }] }
    ]
  });
}

export { consultarCatalogo, buscarDetalheProduto };
