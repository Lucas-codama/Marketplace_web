import { Carrinho, Categoria, ItemCarrinho, Produto, Usuario } from '../models/index.js';

class ErroCarrinho extends Error {
  constructor(mensagem, status = 422) { super(mensagem); this.status = status; }
}

function quantidadeValida(valor) {
  const quantidade = Number(valor);
  if (!Number.isInteger(quantidade) || quantidade < 1) throw new ErroCarrinho('A quantidade deve ser um inteiro maior que zero.');
  return quantidade;
}

async function obterOuCriarCarrinho(usuarioId, transaction) {
  const [carrinho] = await Carrinho.findOrCreate({ 
    where: { usuarioId }, 
    defaults: { usuarioId }, 
    transaction 
  });
  return carrinho;
}

async function carregarCarrinho(usuarioId, transaction) {
  const carrinho = await obterOuCriarCarrinho(usuarioId, transaction);
  return Carrinho.findByPk(carrinho.id, {
    include: [{ 
      model: ItemCarrinho, 
      as: 'itens', include: [{ 
        model: Produto, 
        as: 'produto', include: [{ 
          model: Categoria, 
          as: 'categoria' }, { 
            model: Usuario, 
            as: 'vendedor', 
            attributes: ['id', 'username', 'nomeCompleto'] 
          }] 
        }] 
      }],
    order: [[{ 
      model: ItemCarrinho, 
      as: 'itens' }, 
      'createdAt', 
      'ASC'
    ]],
    transaction
  });
}

function serializarCarrinho(carrinho) {
  const itens = (carrinho?.itens || []).map((item) => ({
    id: item.id,
    quantidade: item.quantidade,
    subtotal: Number(item.produto.preco) * item.quantidade,
    produto: { 
      id: item.produto.id, 
      nome: item.produto.nome, 
      preco: Number(item.produto.preco), 
      estoque: item.produto.estoque, 
      imagem: item.produto.imagem, 
      estado: item.produto.estado, 
      categoria: item.produto.categoria, 
      vendedor: item.produto.vendedor 
    }
  }));

  return { 
    id: carrinho?.id || null, 
    itens, 
    quantidadeTotal: itens.reduce((soma, item) => soma + item.quantidade, 0), 
    valorTotal: itens.reduce((soma, item) => soma + item.subtotal, 0) 
  };
}

async function obterCarrinho(usuarioId) { 
  return serializarCarrinho(await carregarCarrinho(usuarioId)); 
}

async function adicionarItem(usuarioId, produtoId, valorQuantidade = 1) {
  const quantidade = quantidadeValida(valorQuantidade);

  const produto = await Produto.findByPk(produtoId);

  if (!produto) throw new ErroCarrinho('Produto não encontrado.', 404);

  if (produto.estado !== 'ativo' || produto.estoque < 1) throw new ErroCarrinho('Escolha outro produto; este item não está disponível.');

  const carrinho = await obterOuCriarCarrinho(usuarioId);

  const item = await ItemCarrinho.findOne({ where: { carrinhoId: carrinho.id, produtoId: produto.id } });

  const novaQuantidade = (item?.quantidade || 0) + quantidade;

  if (novaQuantidade > produto.estoque) throw new ErroCarrinho(`Reduza a quantidade. Há ${produto.estoque} unidade(s) em estoque.`);

  if (item) await item.update({ quantidade: novaQuantidade });

  else await ItemCarrinho.create({ carrinhoId: carrinho.id, produtoId: produto.id, quantidade });

  await carrinho.update({ atualizadoEm: new Date() });

  return obterCarrinho(usuarioId);
}

async function alterarQuantidade(usuarioId, itemId, valorQuantidade) {
  const quantidade = quantidadeValida(valorQuantidade);

  const carrinho = await obterOuCriarCarrinho(usuarioId);

  const item = await ItemCarrinho.findOne({ where: { id: itemId, carrinhoId: carrinho.id }, include: [{ model: Produto, as: 'produto' }] });

  if (!item) throw new ErroCarrinho('Item não encontrado.', 404);

  if (item.produto.estado !== 'ativo') throw new ErroCarrinho('Remova este item do carrinho; o produto não está mais disponível.');

  if (quantidade > item.produto.estoque) throw new ErroCarrinho(`Informe uma quantidade entre 1 e ${item.produto.estoque}.`);

  await item.update({ quantidade });

  return obterCarrinho(usuarioId);
}

async function removerItem(usuarioId, itemId) {
  const carrinho = await obterOuCriarCarrinho(usuarioId);

  const removidos = await ItemCarrinho.destroy({ where: { id: itemId, carrinhoId: carrinho.id } });

  if (!removidos) throw new ErroCarrinho('Item não encontrado.', 404);

  return obterCarrinho(usuarioId);
}

export { 
  ErroCarrinho, 
  obterCarrinho, 
  carregarCarrinho, 
  adicionarItem, 
  alterarQuantidade,
  removerItem 
};
