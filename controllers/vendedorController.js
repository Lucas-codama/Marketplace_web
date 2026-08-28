import { Op } from 'sequelize';
import { Avaliacao, Categoria, ItemPedido, Pedido, Produto, Usuario } from '../models/index.js';
import { caminhoPublicoDaImagem, removerImagemProduto } from '../config/upload.js';
import { emitirEstoqueAtualizado } from '../services/tempoRealService.js';
import { ErroPedidoVendedor, atualizarEstadoPedido, buscarPedidoVendedor, listarPedidosVendedor } from '../services/pedidoVendedorService.js';

const texto = (valor) => String(valor || '').trim();

function decimal(valor) {
  const entrada = texto(valor);
  return Number(entrada.includes(',') ? entrada.replace(/\./g, '').replace(',', '.') : entrada);
}

function dadosProduto(req) {
  return {
    nome: texto(req.body.nome),
    descricao: texto(req.body.descricao),
    preco: decimal(req.body.preco),
    estoque: Number(req.body.estoque),
    categoriaId: Number(req.body.categoriaId),
    destaque: req.body.destaque === 'on'
  };
}

async function categorias() {
  return Categoria.findAll({ where: { ativa: true }, order: [['nome', 'ASC']] });
}

async function painel(req, res, next) {
  try {
    const vendedorId = req.usuarioAtual.id;
    const [total, ativos, semEstoque, baixo, pendentes, unidades, valor, recentes, avaliacoesRecentes] = await Promise.all([
      Produto.count({ where: { vendedorId } }),
      Produto.count({ where: { vendedorId, estado: 'ativo' } }),
      Produto.count({ where: { vendedorId, estoque: 0 } }),
      Produto.count({ where: { vendedorId, estoque: { [Op.between]: [1, 5] } } }),
      ItemPedido.count({
        where: {
          vendedorId,
          estado: {
            [Op.in]: ['aguardando_confirmacao', 'confirmado', 'em_preparacao']
          }
        },
        distinct: true,
        col: 'pedidoId'
      }),
      ItemPedido.sum('quantidade', {
        where: {
          vendedorId,
          estado: {
            [Op.ne]: 'cancelado'
          }
        }
      }),
      ItemPedido.sum('subtotal', {
        where: {
          vendedorId,
          estado: {
            [Op.ne]: 'cancelado'
          }
        }
      }),
      Pedido.findAll({
        include: [
          {
            model: ItemPedido,
            as: 'itens',
            required: true,
            where: { vendedorId }
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Avaliacao.findAll({
        where: { estado: 'aprovada' },
        include: [
          {
            model: Produto,
            as: 'produto',
            required: true,
            where: { vendedorId },
            attributes: ['id', 'nome']
          },
          {
            model: Usuario,
            as: 'cliente',
            attributes: ['nomeCompleto']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 3
      })
    ]);

    return res.renderComLayout('vendedor/painel', {
      titulo: 'Painel do vendedor',
      resumo: {
        total,
        ativos,
        semEstoque,
        baixo,
        pendentes,
        unidades: Number(unidades || 0),
        valor: Number(valor || 0)
      },
      recentes,
      avaliacoesRecentes
    });
  } catch (erro) {
    return next(erro);
  }
}

async function listarProdutos(req, res, next) {
  try {
    return res.renderComLayout('vendedor/produtos/index', {
      titulo: 'Meus produtos',
      produtos: await Produto.findAll({ where: { 
        vendedorId: req.usuarioAtual.id 
      }, 
      include: [{ model: Categoria, as: 'categoria' }], 
      order: [['createdAt', 'DESC']] 
    })});

  } catch (erro) {
    return next(erro);
  }
}

async function novoProduto(req, res, next) {
  try {
    return res.renderComLayout('vendedor/produtos/formulario', { 
      titulo: 'Novo produto',
      produto: null, 
      categorias: await categorias(), 
      erros: [], 
      acao: '/vendedor/produtos' 
    });

  } catch (erro) {
    return next(erro);
  }
}

async function criarProduto(req, res, next) {
  const imagem = caminhoPublicoDaImagem(req.file);
  try {

    await Produto.create({ 
      ...dadosProduto(req), 
      vendedorId: req.usuarioAtual.id, 
      imagem: imagem || '/images/produto-placeholder.svg', 
      estado: 'ativo'
    });

    req.definirFlash('success', 'Produto cadastrado.');
    return res.redirect('/vendedor/produtos');

  } catch (erro) {
    if (imagem) await removerImagemProduto(imagem);
    return next(erro);
  }
}

async function editarProduto(req, res, next) {
  try {
    return res.renderComLayout('vendedor/produtos/formulario', {
      titulo: 'Editar produto',
      produto: req.produtoDoVendedor,
      categorias: await categorias(),
      erros: [],
      acao: `/vendedor/produtos/${req.produtoDoVendedor.id}/editar`
    });
  } catch (erro) {
    return next(erro);
  }
}

async function salvarProduto(req, res, next) {
  const produto = req.produtoDoVendedor;
  const novaImagem = caminhoPublicoDaImagem(req.file);
  const anterior = produto.imagem;

  try {
    await produto.update({ ...dadosProduto(req), imagem: novaImagem || anterior });
    if (novaImagem) await removerImagemProduto(anterior);
    req.definirFlash('success', 'Produto atualizado.');
    return res.redirect('/vendedor/produtos');

  } catch (erro) {
    if (novaImagem) await removerImagemProduto(novaImagem);
    return next(erro);

  }
}

async function estadoProduto(req, res, next) {
  try {

    const produto = req.produtoDoVendedor;
    if (produto.estado === 'bloqueado') {
      req.definirFlash('warning', 'Somente o administrador pode liberar este produto.');
      return res.redirect('/vendedor/produtos');
    }
    await produto.update({ estado: produto.estado === 'ativo' ? 'inativo' : 'ativo' });
    return res.redirect('/vendedor/produtos');

  } catch (erro) {
    return next(erro);
  }
}

async function excluirProduto(req, res, next) {
  try {
    const produto = req.produtoDoVendedor;
    if (await ItemPedido.count({ where: { produtoId: produto.id } })) await produto.update({ estado: 'inativo' });
    else {
      const imagem = produto.imagem;
      await produto.destroy();
      await removerImagemProduto(imagem);
    }

    req.definirFlash('success', 'Produto removido ou desativado.');
    return res.redirect('/vendedor/produtos');

  } catch (erro) {
    return next(erro);

  }
}

async function estoque(req, res, next) {
  try {
    return res.renderComLayout('vendedor/estoque', {
      titulo: 'Estoque',
      produtos: await Produto.findAll({ where: { vendedorId: req.usuarioAtual.id }, include: [{ model: Categoria, as: 'categoria' }], order: [['estoque', 'ASC']] })
    });

  } catch (erro) {
    return next(erro);

  }
}

async function apiEstoque(req, res, next) {
  try {
    const valor = Number(req.body.estoque);
    if (!Number.isInteger(valor) || valor < 0) return res.status(422).json({ erro: 'Informe o estoque como um número inteiro igual ou maior que zero.' });
    await req.produtoDoVendedor.update({ estoque: valor });
    emitirEstoqueAtualizado(req.produtoDoVendedor);
    return res.json({ mensagem: 'Estoque atualizado.', produto: req.produtoDoVendedor });

  } catch (erro) {
    return next(erro);

  }
}

async function pedidos(req, res, next) {
  try {
    return res.renderComLayout('vendedor/pedidos/index', { 
      titulo: 'Pedidos recebidos', 
      pedidos: await listarPedidosVendedor(req.usuarioAtual.id) 
    });

  } catch (erro) {
    return next(erro);

  }
}

async function pedido(req, res, next) {
  try {
    const encontrado = await buscarPedidoVendedor(req.params.id, req.usuarioAtual.id);
    if (!encontrado) return res.status(404).renderComLayout('erros/404', { titulo: 'Pedido não encontrado' });
    return res.renderComLayout('vendedor/pedidos/detalhes', { 
      titulo: encontrado.numero, 
      pedido: encontrado 
    });

  } catch (erro) {
    return next(erro);

  }
}

async function apiEstadoPedido(req, res, next) {
  try {
    const resultado = await atualizarEstadoPedido(req.params.id, req.usuarioAtual.id, req.body.estado, req.body.observacao);
    return res.json({ 
      mensagem: 'Pedido atualizado.', 
      estado: resultado.pedido.estado, 
      estadoItens: resultado.estadoItens 
    });

  } catch (erro) {
    if (erro instanceof ErroPedidoVendedor) return res.status(erro.status).json({ erro: erro.message });
    return next(erro);
  }
}

async function avaliacoesRecebidas(req, res, next) {
  try {
    const avaliacoes = await Avaliacao.findAll({
      include: [
        { model: Produto, as: 'produto', required: true, where: { vendedorId: req.usuarioAtual.id }, attributes: ['id', 'nome'] },
        { model: Usuario, as: 'cliente', attributes: ['nomeCompleto', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    const aprovadas = avaliacoes.filter((item) => item.estado === 'aprovada');
    const media = aprovadas.length ? aprovadas.reduce((soma, item) => soma + item.nota, 0) / aprovadas.length : 0;
    return res.renderComLayout('vendedor/avaliacoes', { titulo: 'Avaliações recebidas', avaliacoes, media });

  } catch (erro) {
    return next(erro);
  }
}

export {
  painel,
  listarProdutos,
  novoProduto,
  criarProduto,
  editarProduto,
  salvarProduto,
  estadoProduto,
  excluirProduto,
  estoque,
  apiEstoque,
  pedidos,
  pedido,
  apiEstadoPedido,
  avaliacoesRecebidas
};
