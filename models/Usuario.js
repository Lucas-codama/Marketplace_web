import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';

import sequelize from '../config/database.js';

const Usuario = sequelize.define(
  'Usuario',
  {
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30],
        notEmpty: true
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: 'usuarios',

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