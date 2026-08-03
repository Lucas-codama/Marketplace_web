import sequelize from '../config/database.js';

const Produto = sequelize.define(
  'Produto',
  {
    nome: {
      type: DataTypes.STRING(140),
      allowNull: false,
      validate: {

        notEmpty: {
          msg: 'O nome do produto é obrigatório.'
        },

        len: {
          args: [3, 140],
          msg: 'O nome do produto deve ter entre 3 e 140 caracteres.'
        }
      }
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {

        notEmpty: {
          msg: 'A descrição do produto é obrigatória.'
        },

        len: {
          args: [20, 5000],
          msg: 'A descrição deve ter entre 20 e 5000 caracteres.'
        }
      }
    },

    preco: {

      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,

      validate: {

        min: {
          args: [0.01],
          msg: 'O preço deve ser maior que zero.'
        }
      }
    },

    estoque: {

      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,

      validate: {

        isInt: {
          msg: 'O estoque deve ser um número inteiro.'
        },

        min: {
          args: [0],
          msg: 'O estoque não pode ser negativo.'
        }
      }
    },

    imagem: {

      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '/images/produto-placeholder.svg',

      validate: {

        notEmpty: {
          msg: 'A imagem do produto é obrigatória.'
        }
      }
    },

    estado: {

      type: DataTypes.ENUM(
        'ativo',
        'inativo',
        'bloqueado'
      ),

      allowNull: false,
      defaultValue: 'ativo',

      validate: {

        isIn: {
          args: [['ativo', 'inativo', 'bloqueado']],
          msg: 'O estado do produto é inválido.'
        }
      }
    },

    destaque: {

      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },

  {
    tableName: 'produtos'
  }
);

export default Produto;