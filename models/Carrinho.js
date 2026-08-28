import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Carrinho = sequelize.define('Carrinho', {
  atualizadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'carrinhos' });

export default Carrinho;
