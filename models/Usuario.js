import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';

import sequelize from '../config/database.js';

const Usuario = sequelize.define(
  'Usuario',
  {
    nomeCompleto: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "O nome completo é obrigatório."
        },
        len: {
          args: [3, 120],
          msg: "O nome completo deve ter entre 3 e 120 caracteres."
        }
      }
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        name: 'usuarios_username_unique',
        msg: 'Este nome de usuário já está em uso.'
      },
      set(value) {
        this.setDataValue(
          'username',
          String(value || '').trim().toLowerCase()
        );
      },
      validate: {
        notEmpty: {
          msg: 'O nome de usuário é obrigatório.'
        },
        len: {
          args: [3, 30],
          msg: 'O nome de usuário deve ter entre 3 e 30 caracteres.'
        },
        is: {
          args: /^[a-z0-9_]+$/i,
          msg: 'O nome de usuário só pode conter letras, números e sublinhados.'
        }
      }
    },

    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: {
        name: 'usuarios_email_unique',
        msg: 'Este e-mail já está em uso.'
      },
      set(value) {
        this.setDataValue(
          'email',
          String(value || '').trim().toLowerCase()
        );
      },
      validate: {
        notEmpty: {
          msg: 'O e-mail é obrigatório.'
        },
        isEmail: {
          msg: 'O e-mail informado não é válido.'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    papel: {
      type: DataTypes.ENUM('cliente', 'vendedor', 'admin'),
      allowNull: false,
      defaultValue: 'cliente'
    },

        ultimoLoginEm: {
      type: DataTypes.DATE,
      allowNull: true
    },

    altoContraste: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    escalaFonte: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1
    },

    corTexto: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: null
    },

    corFundo: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: null
    },

    notificacoesPausadas: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    status: {
      type: DataTypes.ENUM('ativo', 'bloqueado'),
      allowNull: false,
      defaultValue: 'ativo'
    },

    ultimoLoginEm: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'usuarios',

    defaultScope: {
      attributes: {
        exclude: ['password']
      }
    },

    scopes: {
      comSenha: {
        attributes: [
          'id',
          'nomeCompleto',
          'username',
          'email',
          'password',
          'papel',
          'status',
          'ultimoLoginEm',
          'createdAt',
          'updatedAt'
        ]
      }
    },

    hooks: {
      beforeSave: async (usuario) => {
        if (!usuario.changed('password')) {
          return;
        }

        usuario.password = await bcrypt.hash(
          usuario.password,
          12
        );
      }
    }
  }
);

Usuario.prototype.validarSenha = function validarSenha(
  senhaInformada
) {
  return bcrypt.compare(senhaInformada, this.password);
};

Usuario.prototype.toJSON = function toJSON() {
  const valores = {
    ...this.get()
  };

  delete valores.password;

  return valores;
};

export default Usuario;