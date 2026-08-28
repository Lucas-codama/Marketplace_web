import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notificacao = sequelize.define(
  'Notificacao',
  {
    tipo: { type: DataTypes.ENUM('nova_venda', 'pedido_atualizado', 'sistema'), allowNull: false },
    titulo: { type: DataTypes.STRING(120), allowNull: false },
    mensagem: { type: DataTypes.STRING(500), allowNull: false },
    link: { type: DataTypes.STRING(255), allowNull: true },
    lida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dados: { type: DataTypes.JSON, allowNull: true }
  },
  { tableName: 'notificacoes' }
);

export default Notificacao;
