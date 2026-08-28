import { Notificacao } from '../models/index.js';

let ioAtual = null;
function configurarTempoReal(io) {
  ioAtual = io;
}

async function notificarNovaVenda(pedido, vendedorIds) {
  for (const vendedorId of [...new Set(vendedorIds)]) {
    const notificacao = await Notificacao.create({
      usuarioId: vendedorId,
      tipo: 'nova_venda',
      titulo: 'Nova venda recebida',
      mensagem: `O pedido ${pedido.numero} possui produtos da sua loja.`,
      link: `/vendedor/pedidos/${pedido.id}`,
      dados: { pedidoId: pedido.id }
    });
    ioAtual?.to(`vendedor:${vendedorId}`).emit('nova_venda', notificacao.toJSON());
  }
}

async function notificarPedidoAtualizado(pedido) {
  const notificacao = await Notificacao.create({
    usuarioId: pedido.clienteId,
    tipo: 'pedido_atualizado',
    titulo: 'Pedido atualizado',
    mensagem: `O pedido ${pedido.numero} agora está como ${pedido.estado.replaceAll('_', ' ')}.`,
    link: `/pedidos/${pedido.id}`,
    dados: { pedidoId: pedido.id, estado: pedido.estado }
  });
  ioAtual?.to(`usuario:${pedido.clienteId}`).emit('pedido_atualizado', { ...notificacao.toJSON(), pedidoId: pedido.id, estado: pedido.estado });
}

function emitirEstoqueAtualizado(produto) {
  ioAtual
    ?.to(`produto:${produto.id}`)
    .emit('estoque_atualizado', { produtoId: produto.id, estoque: produto.estoque, disponivel: produto.estado === 'ativo' && produto.estoque > 0 });
}

export { configurarTempoReal, notificarNovaVenda, notificarPedidoAtualizado, emitirEstoqueAtualizado };
