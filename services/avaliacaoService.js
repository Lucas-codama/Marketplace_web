import { fn, col } from 'sequelize';
import { sequelize, Avaliacao, ItemPedido, Pedido, Usuario } from '../models/index.js';

class ErroAvaliacao extends Error {
  constructor(mensagem, status = 422) {
    super(mensagem);
    this.status = status;
  }
}

async function listarAvaliacoes(produtoId) {
  const [avaliacoes, resumo] = await Promise.all([
    Avaliacao.findAll({
      where: { produtoId, estado: 'aprovada' },
      include: [{ model: Usuario, as: 'cliente', attributes: ['nomeCompleto', 'username'] }],
      order: [['createdAt', 'DESC']]
    }),
    Avaliacao.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'quantidade'],
        [fn('AVG', col('nota')), 'media']
      ],
      where: { produtoId, estado: 'aprovada' },
      raw: true
    })
  ]);
  return { avaliacoes, resumo: { quantidade: Number(resumo?.quantidade || 0), media: Number(resumo?.media || 0) } };
}

async function itensAvaliaveis(clienteId, produtoId) {
  const itens = await ItemPedido.findAll({
    where: { produtoId, estado: 'entregue' },
    include: [
      { model: Pedido, as: 'pedido', required: true, where: { clienteId }, attributes: ['id', 'numero', 'createdAt'] },
      { model: Avaliacao, as: 'avaliacao', required: false }
    ],
    order: [['createdAt', 'DESC']]
  });
  return itens.filter((item) => !item.avaliacao);
}

async function criarAvaliacao(clienteId, produtoId, dados) {
  const nota = Number(dados.nota);
  const comentario = String(dados.comentario || '').trim();
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new ErroAvaliacao('A nota deve estar entre 1 e 5.');
  if (comentario.length < 10) throw new ErroAvaliacao('O comentário precisa ter ao menos 10 caracteres.');
  return sequelize.transaction(async (transaction) => {
    const item = await ItemPedido.findOne({
      where: { id: dados.itemPedidoId, produtoId, estado: 'entregue' },
      include: [{ model: Pedido, as: 'pedido', where: { clienteId }, required: true }],
      transaction
    });
    if (!item) throw new ErroAvaliacao('Somente compras entregues podem ser avaliadas.', 403);
    if (await Avaliacao.findOne({ where: { itemPedidoId: item.id }, transaction })) throw new ErroAvaliacao('Esta compra já foi avaliada.', 409);
    return Avaliacao.create({ clienteId, produtoId, itemPedidoId: item.id, nota, comentario }, { transaction });
  });
}

export { ErroAvaliacao, listarAvaliacoes, itensAvaliaveis, criarAvaliacao };
