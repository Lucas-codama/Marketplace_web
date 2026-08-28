import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Categoria = sequelize.define(

  'Categoria', {

    nome: {
        
      type: DataTypes.STRING(100),
      allowNull: false,

      unique: {
        name: 'categorias_nome_unique',
        msg: 'Já existe uma categoria com esse nome.'
      },
      validate: {

        notEmpty: {
          msg: 'O nome da categoria é obrigatório.'
        },

        len: {
          args: [2, 100],
          msg: 'O nome da categoria deve ter entre 2 e 100 caracteres.'
        }
      }
    },

    slug: {

      type: DataTypes.STRING(120),
      allowNull: false,

      unique: {
        name: 'categorias_slug_unique',
        msg: 'Esse endereço de categoria já está em uso.'
      },

      set(valor) {
        this.setDataValue('slug', String(valor || '').trim().toLowerCase()
        );
      },

      validate: {

        notEmpty: {
          msg: 'O endereço da categoria é obrigatório.'
        },
        
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'O endereço da categoria contém caracteres inválidos.'
        }
      }
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    ativa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'categorias'
  }
);

export default Categoria;
