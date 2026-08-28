import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PerfilVendedor = sequelize.define(
    'PerfilVendedor',
    {
        nomeLoja: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: {
                name: 'perfis_vendedor_nome_loja_unique',
                msg: 'Já existe uma loja com esse nome.'
            },
            validate: {
                notEmpty: {
                    msg: 'O nome da loja é obrigatório.'
                },
                len: {
                    args: [3, 120],
                    msg: 'O nome da loja deve ter entre 3 e 120 caracteres.'
                }
            }
        },
        slug: {
            type: DataTypes.STRING(140),
            allowNull: false,
            unique: {
                name: 'perfis_vendedor_slug_unique',
                msg: 'Esse endereço de loja já está em uso.'
            },

            set(valor) {
                this.setDataValue(
                    'slug',
                    String(valor || '')
                        .trim()
                        .toLowerCase()
                );
            },
            validate: {
                notEmpty: {
                    msg: 'O endereço da loja é obrigatório.'
                },
                is: {
                    args: /^[a-z0-9-]+$/,
                    msg: 'O endereço da loja contém caracteres inválidos.'
                }
            }
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 2000],
                    msg: 'A descrição deve possuir no máximo 2000 caracteres.'
                }
            }
        },
        cidade: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        uf: {
            type: DataTypes.STRING(2),
            allowNull: true,
            set(valor) {
                this.setDataValue(
                    'uf',
                    String(valor || '')
                        .trim()
                        .toUpperCase()
                );
            },
            validate: {
                len: {

                    args: [0, 2],
                    msg: 'A UF deve possuir duas letras.'
                }
            }
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        tableName: 'perfis_vendedor'
    }
);
export default PerfilVendedor;