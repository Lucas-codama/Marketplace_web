import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const estados = ['aguardando_confirmacao', 'confirmado', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const Pedido = sequelize.define('Pedido', {
  numero: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  valorTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0.01 } },
  estado: { type: DataTypes.ENUM(...estados), allowNull: false, defaultValue: 'aguardando_confirmacao' },
  formaPagamento: { type: DataTypes.ENUM('pix', 'cartao', 'boleto'), allowNull: false },
  formaEntrega: { type: DataTypes.ENUM('padrao', 'expressa', 'retirada'), allowNull: false },
  enderecoEntrega: { type: DataTypes.JSON, allowNull: false },
  observacao: { type: DataTypes.STRING(500), allowNull: true }
}, { tableName: 'pedidos' });

export default Pedido;
