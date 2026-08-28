import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HistoricoPedido = sequelize.define('HistoricoPedido', {
  estadoAnterior: { type: DataTypes.STRING(40), allowNull: true },
  novoEstado: { type: DataTypes.STRING(40), allowNull: false },
  observacao: { type: DataTypes.STRING(500), allowNull: true }
}, { tableName: 'historicos_pedido', updatedAt: false });

export default HistoricoPedido;
