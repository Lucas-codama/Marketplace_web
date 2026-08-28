import { sequelize, HistoricoPedido, ItemPedido, Pedido, Usuario } from '../models/index.js';
import { notificarPedidoAtualizado } from './tempoRealService.js';

class ErroPedidoVendedor extends Error {
  constructor(mensagem, status = 422) {
    super(mensagem);
    this.status = status;
  }
}

const transicoes = {
  aguardando_confirmacao: ['confirmado', 'cancelado'],
  confirmado: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: []
};

const ordem = { aguardando_confirmacao: 0, confirmado: 1, em_preparacao: 2, enviado: 3, entregue: 4 };

function estadoGeral(itens) {
  const ativos = itens.filter((item) => item.estado !== 'cancelado');
  if (!ativos.length) return 'cancelado';
  return ativos.reduce((menor, item) => ordem[item.estado] < ordem[menor] ? item.estado : menor, ativos[0].estado);

}

async function listarPedidosVendedor(vendedorId) {
  return Pedido.findAll({
    include: [
      { model: ItemPedido, as: 'itens', required: true, where: { vendedorId } },
      { model: Usuario, as: 'cliente', attributes: ['id', 'nomeCompleto', 'username'] }
    ],
    order: [['createdAt', 'DESC']]
  });
}

async function buscarPedidoVendedor(id, vendedorId) {
  return Pedido.findOne({
    where: { id },
    include: [
      { model: ItemPedido, as: 'itens', required: true, where: { vendedorId } },
      { model: Usuario, as: 'cliente', attributes: ['id', 'nomeCompleto', 'username', 'email'] },
      { model: HistoricoPedido, as: 'historico' }
    ],
    order: [[{ model: HistoricoPedido, as: 'historico' }, 'createdAt', 'ASC']]
  });
}

async function atualizarEstadoPedido(id, vendedorId, novoEstado, observacao) {
  const resultado = await sequelize.transaction(async (transaction) => {
    const pedido = await Pedido.findByPk(id, { transaction });
    if (!pedido) throw new ErroPedidoVendedor('Pedido não encontrado.', 404);

    const itens = await ItemPedido.findAll({ where: { pedidoId: id, vendedorId }, transaction });
    if (!itens.length) throw new ErroPedidoVendedor('Pedido não pertence a este vendedor.', 403);
    
    for (const item of itens) {
      const estadosPermitidos = transicoes[item.estado] || [];
      if (!estadosPermitidos.includes(novoEstado)) {
        const sugestao = estadosPermitidos.length
          ? `Escolha um destes estados: ${estadosPermitidos.join(', ')}.`
          : 'Este item não aceita novas alterações de estado.';
        throw new ErroPedidoVendedor(`Não é possível alterar o estado atual ${item.estado} para ${novoEstado}. ${sugestao}`);
      }
    }
    
    await ItemPedido.update({ estado: novoEstado }, { where: { pedidoId: id, vendedorId }, transaction });
    const todos = await ItemPedido.findAll({ where: { pedidoId: id }, transaction });
    const anterior = pedido.estado;
    const atual = estadoGeral(todos);
    
    if (atual !== anterior) {
      await pedido.update({ estado: atual }, { transaction });
      await HistoricoPedido.create(
        { pedidoId: id, usuarioResponsavelId: vendedorId, estadoAnterior: anterior, novoEstado: atual, observacao: String(observacao || '').trim() || 'Atualizado pelo vendedor.' },
        { transaction }
      );
    }

    return { pedido, estadoItens: novoEstado };
  });
  
  await notificarPedidoAtualizado(resultado.pedido);
  return resultado;
}

export { ErroPedidoVendedor, listarPedidosVendedor, buscarPedidoVendedor, atualizarEstadoPedido };
