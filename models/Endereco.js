import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Endereco = sequelize.define('Endereco', {
  apelido: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Principal' },
  destinatario: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
  cep: {
    type: DataTypes.STRING(8), allowNull: false,
    set(valor) { this.setDataValue('cep', String(valor || '').replace(/\D/g, '')); },
    validate: { is: { args: /^\d{8}$/, msg: 'O CEP deve possuir oito números.' } }
  },
  logradouro: { type: DataTypes.STRING(160), allowNull: false, validate: { notEmpty: true } },
  numero: { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: true } },
  complemento: { type: DataTypes.STRING(100), allowNull: true },
  bairro: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  cidade: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  uf: {
    type: DataTypes.STRING(2), allowNull: false,
    set(valor) { this.setDataValue('uf', String(valor || '').trim().toUpperCase()); },
    validate: { is: { args: /^[A-Z]{2}$/, msg: 'A UF deve possuir duas letras.' } }
  },
  principal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, { tableName: 'enderecos' });

export default Endereco;
