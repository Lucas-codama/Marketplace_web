import { Op } from 'sequelize';
import { sequelize, Avaliacao, Categoria, ItemPedido, Pedido, PerfilVendedor, Produto, Usuario } from '../models/index.js';

const texto = (valor) => String(valor || '').trim();
function slug(valor) {
  return texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function painel(req, res, next) {
  try {
    const [usuarios, clientes, vendedores, produtos, pedidos, bloqueados, pendentes, valor, recentes] = await Promise.all([
      Usuario.count(),
      Usuario.count({ where: { papel: 'cliente' } }),
      Usuario.count({ where: { papel: 'vendedor' } }),
      Produto.count(),
      Pedido.count(),
      Produto.count({ where: { estado: { [Op.in]: ['bloqueado', 'inativo'] } } }),
      Avaliacao.count({ where: { estado: 'pendente' } }),
      Pedido.sum('valorTotal'),
      Pedido.findAll({
        include: [
          { model: Usuario, as: 'cliente', attributes: ['nomeCompleto', 'username'] },
          { model: ItemPedido, as: 'itens' }
        ],
        order: [['createdAt', 'DESC']],
        limit: 8
      })
    ]);

    return res.renderComLayout('admin/index', {
      titulo: 'Administração',
      resumo: {
        usuarios,
        clientes,
        vendedores,
        produtos,
        pedidos,
        bloqueados,
        pendentes,
        valor: Number(valor || 0)
      },
      recentes
    });
  } catch (erro) {
    return next(erro);
  }
}

async function usuarios(req, res, next) {
  try {
    const busca = texto(req.query.busca);

    const where = busca ? { [Op.or]: [{ nomeCompleto: { [Op.like]: `%${busca}%` } }, { username: { [Op.like]: `%${busca}%` } }, { email: { [Op.like]: `%${busca}%` } }] } : {};
   
    if (['cliente', 'vendedor', 'admin'].includes(req.query.papel)) where.papel = req.query.papel;
    
    if (['ativo', 'bloqueado'].includes(req.query.status)) where.status = req.query.status;
    
    return res.renderComLayout('admin/usuarios', {
      titulo: 'Usuários',
      usuarios: await Usuario.findAll({ where, order: [['createdAt', 'DESC']] }),
      filtros: req.query,
      usuarioAtual: req.usuarioAtual
    });

  } catch (erro) {
    return next(erro);

  }
}

async function statusUsuario(req, res, next) {
  try {
    if (!['ativo', 'bloqueado'].includes(req.body.status)) return res.status(422).json({ erro: 'Selecione o status Ativo ou Bloqueado.' });
    
    const usuario = await Usuario.findByPk(req.params.id);
    
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    
    if (usuario.id === req.usuarioAtual.id) return res.status(422).json({ erro: 'Você não pode bloquear a própria conta.' });
    
    await usuario.update({ status: req.body.status });
    
    return res.json({ mensagem: 'Status atualizado.', usuario: { id: usuario.id, status: usuario.status } });

  } catch (erro) {
    return next(erro);

  }
}

async function vendedores(req, res, next) {
  try {
    return res.renderComLayout('admin/vendedores', {
      titulo: 'Vendedores',
      vendedores: await Usuario.findAll({
        where: { papel: 'vendedor' },
        include: [
          { model: PerfilVendedor, as: 'perfilVendedor', required: false },
          { model: Produto, as: 'produtosVenda', attributes: ['id'] }
        ],
        order: [['createdAt', 'DESC']]
      })
    });
  } catch (erro) {
    return next(erro);
  }
}

async function statusVendedor(req, res, next) {
  try {
    if (!['ativo', 'bloqueado'].includes(req.body.status)) return res.status(422).json({ erro: 'Selecione o status Ativo ou Bloqueado.' });
    
    const vendedor = await Usuario.findOne({ where: { id: req.params.id, papel: 'vendedor' }, include: [{ model: PerfilVendedor, as: 'perfilVendedor', required: false }] });
    
    if (!vendedor) return res.status(404).json({ erro: 'Vendedor não encontrado.' });
    
    await sequelize.transaction(async (transaction) => {
      await vendedor.update({ status: req.body.status }, { transaction });
      if (vendedor.perfilVendedor) await vendedor.perfilVendedor.update({ ativo: req.body.status === 'ativo' }, { transaction });
    });

    return res.json({ mensagem: 'Vendedor atualizado.', vendedor: { id: vendedor.id, status: vendedor.status } });

  } catch (erro) {
    return next(erro);

  }
}

async function categorias(req, res, next) {
  try {
    return res.renderComLayout('admin/categorias', {
      titulo: 'Categorias',
      categorias: await Categoria.findAll({ include: [{ model: Produto, as: 'produtos', attributes: ['id'] }], order: [['nome', 'ASC']] })
    });

  } catch (erro) {
    return next(erro);

  }
}

async function criarCategoria(req, res, next) {
  try {
    await Categoria.create({ nome: texto(req.body.nome), slug: slug(req.body.nome), descricao: texto(req.body.descricao) || null });

    req.definirFlash('success', 'Categoria criada.');

    return res.redirect('/admin/categorias');
  } catch (erro) {
    return next(erro);

  }
}

async function editarCategoria(req, res, next) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);

    if (!categoria) return res.status(404).renderComLayout('erros/404', { titulo: 'Categoria não encontrada' });

    await categoria.update({ 
      nome: texto(req.body.nome), 
      slug: slug(req.body.nome), 
      descricao: texto(req.body.descricao) || null, 
      ativa: req.body.ativa === 'on' 
    });

    req.definirFlash('success', 'Categoria atualizada.');
    return res.redirect('/admin/categorias');

  } catch (erro) {
    return next(erro);

  }
}

async function produtos(req, res, next) {
  try {
    const where = ['ativo', 'inativo', 'bloqueado'].includes(req.query.estado) ? { estado: req.query.estado } : {};
    return res.renderComLayout('admin/produtos', {
      titulo: 'Produtos',
      produtos: await Produto.findAll({
        where,
        include: [
          { model: Categoria, as: 'categoria' },
          { model: Usuario, as: 'vendedor', attributes: ['id', 'username', 'nomeCompleto'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      estado: req.query.estado || ''
    });

  } catch (erro) {
    return next(erro);

  }
}

async function estadoProduto(req, res, next) {
  try {
    if (!['ativo', 'inativo', 'bloqueado'].includes(req.body.estado)) return res.status(422).json({ erro: 'Selecione um estado válido: Ativo, Inativo ou Bloqueado.' });

    const produto = await Produto.findByPk(req.params.id);

    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    await produto.update({ estado: req.body.estado });

    return res.json({ mensagem: 'Produto atualizado.', produto: { id: produto.id, estado: produto.estado } });
  } catch (erro) {
    return next(erro);

  }
}

async function avaliacoes(req, res, next) {
  try {
    const where = ['pendente', 'aprovada', 'ocultada'].includes(req.query.estado) ? { estado: req.query.estado } : {};

    return res.renderComLayout('admin/avaliacoes', {
      titulo: 'Avaliações',
      avaliacoes: await Avaliacao.findAll({
        where,
        include: [
          { model: Usuario, as: 'cliente', attributes: ['nomeCompleto', 'username'] },
          { model: Produto, as: 'produto', attributes: ['id', 'nome'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      estado: req.query.estado || ''
    });

  } catch (erro) {
    return next(erro);

  }
}

async function moderarAvaliacao(req, res, next) {
  try {
    if (!['aprovada', 'ocultada'].includes(req.body.estado)) return res.status(422).json({ erro: 'Selecione Aprovar ou Ocultar para moderar a avaliação.' });

    const avaliacao = await Avaliacao.findByPk(req.params.id);

    if (!avaliacao) return res.status(404).json({ erro: 'Avaliação não encontrada.' });

    await avaliacao.update({ estado: req.body.estado, moderadorId: req.usuarioAtual.id, moderadaEm: new Date() });

    return res.json({ mensagem: 'Avaliação moderada.', avaliacao: { id: avaliacao.id, estado: avaliacao.estado } });

  } catch (erro) {
    return next(erro);

  }
}

async function pedidos(req, res, next) {
  try {
    return res.renderComLayout('admin/pedidos', {
      titulo: 'Pedidos',
      pedidos: await Pedido.findAll({
        include: [
          { model: Usuario, as: 'cliente', attributes: ['nomeCompleto', 'username'] },
          { model: ItemPedido, as: 'itens' }
        ],
        order: [['createdAt', 'DESC']]
      })
    });
  } catch (erro) {
    return next(erro);
  }
}

export { 
  painel, 
  usuarios, 
  statusUsuario, 
  vendedores, 
  statusVendedor, 
  categorias, 
  criarCategoria, 
  editarCategoria, 
  produtos, 
  estadoProduto, 
  avaliacoes, 
  moderarAvaliacao, 
  pedidos 
};
