import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ItemCarrinho = sequelize.define('ItemCarrinho', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  quantidade: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { isInt: true, min: { args: [1], msg: 'A quantidade mínima é 1.' } } }
}, { tableName: 'itens_carrinho', indexes: [{ unique: true, fields: ['carrinho_id', 'produto_id'] }] });

export default ItemCarrinho;
