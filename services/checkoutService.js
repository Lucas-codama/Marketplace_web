import { randomUUID } from 'node:crypto';
import { Op, literal } from 'sequelize';
import { sequelize, Carrinho, Endereco, HistoricoPedido, ItemCarrinho, ItemPedido, Pedido, Produto } from '../models/index.js';
import { notificarNovaVenda } from './tempoRealService.js';

class ErroCheckout extends Error {
  constructor(mensagem, status = 422) { super(mensagem); this.status = status; }
}

async function finalizarCompra(usuarioId, dados) {
  if (!['pix', 'cartao', 'boleto'].includes(dados.formaPagamento)) throw new ErroCheckout('Forma de pagamento inválida.');

  if (!['padrao', 'expressa', 'retirada'].includes(dados.formaEntrega)) throw new ErroCheckout('Forma de entrega inválida.');

  const resultado = await sequelize.transaction(async (transaction) => {

    const endereco = await Endereco.findOne({ where: { id: dados.enderecoId, usuarioId }, transaction });

    if (!endereco) throw new ErroCheckout('Selecione um endereço válido.');

    const carrinho = await Carrinho.findOne({ where: { usuarioId }, include: [{ model: ItemCarrinho, as: 'itens', include: [{ model: Produto, as: 'produto' }] }], transaction });

    if (!carrinho?.itens.length) throw new ErroCheckout('Seu carrinho está vazio.');

    let valorTotal = 0;
    for (const item of carrinho.itens) {
      if (item.produto.estado !== 'ativo' || item.produto.estoque < item.quantidade) throw new ErroCheckout(`Estoque indisponível para ${item.produto.nome}.`);
      valorTotal += Number(item.produto.preco) * item.quantidade;
    }

    const pedido = await Pedido.create({
      numero: `NXT-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
      clienteId: usuarioId,
      valorTotal: valorTotal.toFixed(2),
      formaPagamento: dados.formaPagamento,
      formaEntrega: dados.formaEntrega,
      enderecoEntrega: endereco.toJSON(),
      observacao: String(dados.observacao || '').trim() || null
    }, { transaction });

    const vendedorIds = [];

    for (const item of carrinho.itens) {
      const produto = item.produto;

      const [alterados] = await Produto.update({ estoque: literal(`estoque - ${item.quantidade}`) }, { 
        where: { 
          id: produto.id, 
          estado: 'ativo', 
          estoque: { [Op.gte]: item.quantidade } 
        }, transaction });

      if (alterados !== 1) throw new ErroCheckout(`O estoque de ${produto.nome} mudou. Revise o carrinho.`);

      await ItemPedido.create({ 
        pedidoId: pedido.id, 
        produtoId: produto.id, 
        vendedorId: produto.vendedorId, 
        nomeProduto: produto.nome, 
        precoUnitario: produto.preco, 
        quantidade: item.quantidade, 
        desconto: 0, 
        subtotal: (Number(produto.preco) * item.quantidade).toFixed(2) }, { transaction });

      vendedorIds.push(produto.vendedorId);
    }

    await HistoricoPedido.create({ 
      pedidoId: pedido.id, 
      usuarioResponsavelId: usuarioId, 
      estadoAnterior: null, 
      novoEstado: 'aguardando_confirmacao', 
      observacao: 'Pedido criado pelo cliente.' 
    }, { transaction });

    await ItemCarrinho.destroy({ where: { carrinhoId: carrinho.id }, transaction });
    
    return { pedido, vendedorIds };
  });

  await notificarNovaVenda(resultado.pedido, resultado.vendedorIds);
  return resultado.pedido;
}

export { ErroCheckout, finalizarCompra };
