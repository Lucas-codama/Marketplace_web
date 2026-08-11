import sequelize from '../config/database.js';

import Usuario from './Usuario.js';
import PerfilVendedor from './PerfilVendedor.js';
import Categoria from './Categoria.js';
import Produto from './Produto.js';


Usuario.hasOne(
  PerfilVendedor,
  {
    as: 'perfilVendedor',
    foreignKey: {
      name: 'usuarioId',
      allowNull: false,
      unique: true
    },
    onDelete: 'CASCADE'
  }
);


PerfilVendedor.belongsTo(
  Usuario,
  {
    as: 'usuario',
    foreignKey: {
      name: 'usuarioId',
      allowNull: false,
      unique: true
    }
  }
);


Usuario.hasMany(
  Produto,
  {
    as: 'produtosVenda',
    foreignKey: {
      name: 'vendedorId',
      allowNull: false
    },
    onDelete: 'RESTRICT'
  }
);


Produto.belongsTo(
  Usuario,
  {
    as: 'vendedor',
    foreignKey: {
      name: 'vendedorId',
      allowNull: false
    }
  }
);


Categoria.hasMany(
  Produto,
  {
    as: 'produtos',
    foreignKey: {
      name: 'categoriaId',
      allowNull: false
    },
    onDelete: 'RESTRICT'
  }
);


Produto.belongsTo(
  Categoria,
  {
    as: 'categoria',
    foreignKey: {
      name: 'categoriaId',
      allowNull: false
    }
  }
);


export {
  sequelize,
  Usuario,
  PerfilVendedor,
  Categoria,
  Produto
};