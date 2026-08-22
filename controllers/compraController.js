import { Endereco, HistoricoPedido, ItemPedido, Pedido, Produto, Usuario } from '../models/index.js';
import { ErroCarrinho, adicionarItem, alterarQuantidade, obterCarrinho, removerItem } from '../services/carrinhoService.js';
import { ErroCheckout, finalizarCompra } from '../services/checkoutService.js';

function dadosEndereco(body) {
  const texto = (valor) => String(valor || '').trim();

  return { 
    apelido: texto(body.apelido), 
    destinatario: texto(body.destinatario), 
    cep: texto(body.cep), 
    logradouro: texto(body.logradouro), 
    numero: texto(body.numero), 
    complemento: texto(body.complemento) || null, 
    bairro: texto(body.bairro), 
    cidade: texto(body.cidade), 
    uf: texto(body.uf), principal: 
    body.principal === 'on' };
}

async function listarEnderecos(req, res, next) {
  try { 
    return res.renderComLayout('enderecos/index', { 
      titulo: 'Meus endereços', 
      enderecos: await Endereco.findAll({ where: { 
         usuarioId: req.usuarioAtual.id },
         order: [['principal', 'DESC'], ['createdAt', 'DESC']] }), 
         erros: [] }); 
  } catch (erro) { return next(erro); }
}

async function criarEndereco(req, res, next) {
  try {
    const dados = dadosEndereco(req.body);

    await Endereco.sequelize.transaction(async (transaction) => {
      if (dados.principal) await Endereco.update({ principal: false }, { where: { usuarioId: req.usuarioAtual.id }, transaction });
      const quantidade = await Endereco.count({ where: { usuarioId: req.usuarioAtual.id }, transaction });
      await Endereco.create({ ...dados, usuarioId: req.usuarioAtual.id, principal: dados.principal || quantidade === 0 }, { transaction });
    });

    req.definirFlash('success', 'Endereço cadastrado.');
    return res.redirect('/enderecos');

  } catch (erro) { return next(erro); }
}

async function removerEndereco(req, res, next) {
  try {

    const endereco = await Endereco.findOne({ where: { id: req.params.id, usuarioId: req.usuarioAtual.id } });
    if (!endereco) return res.status(404).renderComLayout('erros/404', { titulo: 'Endereço não encontrado' });
    await endereco.destroy();
    req.definirFlash('success', 'Endereço removido.');
    return res.redirect('/enderecos');

  } catch (erro) { return next(erro); }
}

async function exibirCarrinho(req, res, next) {
  try { return res.renderComLayout('carrinho/index', {
     titulo: 'Carrinho', 
     carrinho: await obterCarrinho(req.usuarioAtual.id) });
  }
  catch (erro) { return next(erro); }
}

function apiCarrinho(operacao) {
  return async (req, res, next) => {
    try { return res.json({ 
      mensagem: 'Carrinho atualizado.', 
      carrinho: await operacao(req) }); 
    }
    catch (erro) { if (erro instanceof ErroCarrinho) return res.status(erro.status).json({ erro: erro.message }); return next(erro); }
  };
}

const apiAdicionar = apiCarrinho((req) => adicionarItem(req.usuarioAtual.id, req.body.produtoId, req.body.quantidade));
const apiAlterar = apiCarrinho((req) => alterarQuantidade(req.usuarioAtual.id, req.params.id, req.body.quantidade));
const apiRemover = apiCarrinho((req) => removerItem(req.usuarioAtual.id, req.params.id));

async function exibirCheckout(req, res, next) {
  try {
    const [enderecos, carrinho] = await Promise.all([Endereco.findAll({ where: { usuarioId: req.usuarioAtual.id }, order: [['principal', 'DESC']] }), obterCarrinho(req.usuarioAtual.id)]);

    if (!carrinho.itens.length) { req.definirFlash('warning', 'Seu carrinho está vazio.'); return res.redirect('/carrinho'); }
    
    return res.renderComLayout('checkout/index', { titulo: 'Finalizar compra', enderecos, carrinho, erros: [] });

  } catch (erro) { return next(erro); }
}

async function confirmarCheckout(req, res, next) {
  try {
    const pedido = await finalizarCompra(req.usuarioAtual.id, { 
      enderecoId: req.body.enderecoId, 
      formaPagamento: req.body.formaPagamento, 
      formaEntrega: req.body.formaEntrega, 
      observacao: req.body.observacao 
    });

    req.definirFlash('success', `Pedido ${pedido.numero} criado com sucesso.`);

    return res.redirect(`/pedidos/${pedido.id}`);

  } catch (erro) {
    if (erro instanceof ErroCheckout) { req.definirFlash('danger', erro.message); return res.redirect('/checkout'); }
    return next(erro);
  }
}

async function listarPedidos(req, res, next) {
  try { 
    
    return res.renderComLayout('pedidos/index', { 
    titulo: 'Meus pedidos', 
    pedidos: await Pedido.findAll({ where: { 
      clienteId: req.usuarioAtual.id }, 
      include: [{ model: ItemPedido, as: 'itens' }], 
      order: [['createdAt', 'DESC']] }) }); 

  } catch (erro) { return next(erro); }
}

async function detalharPedido(req, res, next) {
  try {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id, clienteId: req.usuarioAtual.id },
      include: [
        {
          model: ItemPedido,
          as: 'itens',
          include: [
            { model: Produto, as: 'produto', required: false },
            { model: Usuario, as: 'vendedor', attributes: ['id', 'username'] }
          ]
        },
        {
          model: HistoricoPedido,
          as: 'historico',
          include: [
            {
              model: Usuario,
              as: 'usuarioResponsavel',
              attributes: ['id', 'nomeCompleto', 'username']
            }
          ]
        }
      ],
      order: [[{ model: HistoricoPedido, as: 'historico' }, 'createdAt', 'ASC']]
    });

    if (!pedido) return res.status(404).renderComLayout('erros/404', { titulo: 'Pedido não encontrado' });

    return res.renderComLayout('pedidos/detalhes', {
      titulo: pedido.numero,
      pedido
    });
  } catch (erro) {
    return next(erro);
  }
}

export { 
  listarEnderecos, 
  criarEndereco, 
  removerEndereco, 
  exibirCarrinho, 
  apiAdicionar, 
  apiAlterar, 
  apiRemover, 
  exibirCheckout, 
  confirmarCheckout, 
  listarPedidos, 
  detalharPedido 
};
