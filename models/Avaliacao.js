import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Avaliacao = sequelize.define(
  'Avaliacao',
  {
    nota: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1, max: 5 } },
    comentario: { type: DataTypes.TEXT, allowNull: false, validate: { len: [10, 2000] } },
    estado: { type: DataTypes.ENUM('pendente', 'aprovada', 'ocultada'), allowNull: false, defaultValue: 'pendente' },
    moderadaEm: { type: DataTypes.DATE, allowNull: true }
  },
  { tableName: 'avaliacoes', indexes: [{ unique: true, fields: ['item_pedido_id'] }] }
);

export default Avaliacao;
