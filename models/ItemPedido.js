import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const estados = ['aguardando_confirmacao', 'confirmado', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const ItemPedido = sequelize.define('ItemPedido', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nomeProduto: { type: DataTypes.STRING(140), allowNull: false },
  precoUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  quantidade: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
  desconto: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
  estado: { type: DataTypes.ENUM(...estados), allowNull: false, defaultValue: 'aguardando_confirmacao' }
}, { tableName: 'itens_pedido' });

export default ItemPedido;
