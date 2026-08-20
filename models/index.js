import sequelize from '../config/database.js';
import Usuario from './Usuario.js';
import PerfilVendedor from './PerfilVendedor.js';
import Categoria from './Categoria.js';
import Produto from './Produto.js';
import Endereco from './Endereco.js';
import Carrinho from './Carrinho.js';
import ItemCarrinho from './ItemCarrinho.js';
import Pedido from './Pedido.js';
import ItemPedido from './ItemPedido.js';
import HistoricoPedido from './HistoricoPedido.js';
import Notificacao from './Notificacao.js';
import Avaliacao from './Avaliacao.js';

Usuario.hasOne(PerfilVendedor, { as: 'perfilVendedor', foreignKey: { name: 'usuarioId', allowNull: false, unique: true }, onDelete: 'CASCADE' });
PerfilVendedor.belongsTo(Usuario, { as: 'usuario', foreignKey: { name: 'usuarioId', allowNull: false, unique: true } });
Usuario.hasMany(Produto, { as: 'produtosVenda', foreignKey: { name: 'vendedorId', allowNull: false }, onDelete: 'RESTRICT' });
Produto.belongsTo(Usuario, { as: 'vendedor', foreignKey: { name: 'vendedorId', allowNull: false } });
Categoria.hasMany(Produto, { as: 'produtos', foreignKey: { name: 'categoriaId', allowNull: false }, onDelete: 'RESTRICT' });
Produto.belongsTo(Categoria, { as: 'categoria', foreignKey: { name: 'categoriaId', allowNull: false } });

Usuario.hasMany(Endereco, { as: 'enderecos', foreignKey: { name: 'usuarioId', allowNull: false }, onDelete: 'CASCADE' });
Endereco.belongsTo(Usuario, { as: 'usuario', foreignKey: { name: 'usuarioId', allowNull: false } });
Usuario.hasOne(Carrinho, { as: 'carrinho', foreignKey: { name: 'usuarioId', allowNull: false, unique: true }, onDelete: 'CASCADE' });
Carrinho.belongsTo(Usuario, { as: 'usuario', foreignKey: { name: 'usuarioId', allowNull: false, unique: true } });
Carrinho.hasMany(ItemCarrinho, { as: 'itens', foreignKey: { name: 'carrinhoId', allowNull: false }, onDelete: 'CASCADE' });
ItemCarrinho.belongsTo(Carrinho, { as: 'carrinho', foreignKey: { name: 'carrinhoId', allowNull: false } });
Produto.hasMany(ItemCarrinho, { as: 'itensCarrinho', foreignKey: { name: 'produtoId', allowNull: false }, onDelete: 'CASCADE' });
ItemCarrinho.belongsTo(Produto, { as: 'produto', foreignKey: { name: 'produtoId', allowNull: false } });
Carrinho.belongsToMany(Produto, { as: 'produtos', through: ItemCarrinho, foreignKey: 'carrinhoId', otherKey: 'produtoId' });
Produto.belongsToMany(Carrinho, { as: 'carrinhos', through: ItemCarrinho, foreignKey: 'produtoId', otherKey: 'carrinhoId' });

Usuario.hasMany(Pedido, { as: 'pedidos', foreignKey: { name: 'clienteId', allowNull: false }, onDelete: 'RESTRICT' });
Pedido.belongsTo(Usuario, { as: 'cliente', foreignKey: { name: 'clienteId', allowNull: false } });
Pedido.hasMany(ItemPedido, { as: 'itens', foreignKey: { name: 'pedidoId', allowNull: false }, onDelete: 'CASCADE' });
ItemPedido.belongsTo(Pedido, { as: 'pedido', foreignKey: { name: 'pedidoId', allowNull: false } });
Produto.hasMany(ItemPedido, { as: 'itensPedido', foreignKey: { name: 'produtoId', allowNull: true }, onDelete: 'SET NULL' });
ItemPedido.belongsTo(Produto, { as: 'produto', foreignKey: { name: 'produtoId', allowNull: true } });
Usuario.hasMany(ItemPedido, { as: 'itensVendidos', foreignKey: { name: 'vendedorId', allowNull: false }, onDelete: 'RESTRICT' });
ItemPedido.belongsTo(Usuario, { as: 'vendedor', foreignKey: { name: 'vendedorId', allowNull: false } });
Pedido.belongsToMany(Produto, { as: 'produtos', through: ItemPedido, foreignKey: 'pedidoId', otherKey: 'produtoId' });
Produto.belongsToMany(Pedido, { as: 'pedidos', through: ItemPedido, foreignKey: 'produtoId', otherKey: 'pedidoId' });
Pedido.hasMany(HistoricoPedido, { as: 'historico', foreignKey: { name: 'pedidoId', allowNull: false }, onDelete: 'CASCADE' });
HistoricoPedido.belongsTo(Pedido, { as: 'pedido', foreignKey: { name: 'pedidoId', allowNull: false } });
Usuario.hasMany(HistoricoPedido, { as: 'alteracoesPedidos', foreignKey: { name: 'usuarioResponsavelId', allowNull: true }, onDelete: 'SET NULL' });
HistoricoPedido.belongsTo(Usuario, { as: 'usuarioResponsavel', foreignKey: { name: 'usuarioResponsavelId', allowNull: true } });

Usuario.hasMany(Notificacao, { as: 'notificacoes', foreignKey: { name: 'usuarioId', allowNull: false }, onDelete: 'CASCADE' });
Notificacao.belongsTo(Usuario, { as: 'usuario', foreignKey: { name: 'usuarioId', allowNull: false } });
Usuario.hasMany(Avaliacao, { as: 'avaliacoesFeitas', foreignKey: { name: 'clienteId', allowNull: false }, onDelete: 'CASCADE' });
Avaliacao.belongsTo(Usuario, { as: 'cliente', foreignKey: { name: 'clienteId', allowNull: false } });
Produto.hasMany(Avaliacao, { as: 'avaliacoes', foreignKey: { name: 'produtoId', allowNull: false }, onDelete: 'CASCADE' });
Avaliacao.belongsTo(Produto, { as: 'produto', foreignKey: { name: 'produtoId', allowNull: false } });
ItemPedido.hasOne(Avaliacao, { as: 'avaliacao', foreignKey: { name: 'itemPedidoId', allowNull: false, unique: true }, onDelete: 'CASCADE' });
Avaliacao.belongsTo(ItemPedido, { as: 'itemPedido', foreignKey: { name: 'itemPedidoId', allowNull: false, unique: true } });
Usuario.hasMany(Avaliacao, { as: 'avaliacoesModeradas', foreignKey: { name: 'moderadorId', allowNull: true }, onDelete: 'SET NULL' });
Avaliacao.belongsTo(Usuario, { as: 'moderador', foreignKey: { name: 'moderadorId', allowNull: true } });

export { sequelize, Usuario, PerfilVendedor, Categoria, Produto, Endereco, Carrinho, ItemCarrinho, Pedido, ItemPedido, HistoricoPedido, Notificacao, Avaliacao };
