import 'dotenv/config';

import {
  sequelize,
  Usuario,
  PerfilVendedor,
  Categoria,
  Produto
} from '../models/index.js';

const resetarBanco =
  process.argv.includes('--reset');

async function obterUsuario(dados) {
  let usuario =
    await Usuario
      .scope('comSenha')
      .findOne({
        where: {
          username: dados.username
        }
      });

  if (!usuario) {
    usuario = await Usuario.create(dados);
    return usuario;
  }

  await usuario.update({
    nomeCompleto: dados.nomeCompleto,
    email: dados.email,
    papel: dados.papel,
    status: 'ativo'
  });

  return usuario;
}

async function obterCategoria(dados) {
  const [categoria] =
    await Categoria.findOrCreate({
      where: {
        slug: dados.slug
      },
      defaults: dados
    });

  return categoria;
}

async function obterProduto(dados) {
  const [produto] =
    await Produto.findOrCreate({
      where: {
        nome: dados.nome,
        vendedorId: dados.vendedorId
      },
      defaults: dados
    });

  return produto;
}

async function executarSeed() {
  try {
    await sequelize.authenticate();

    await sequelize.sync({
      force: resetarBanco
    });

    const administrador = await obterUsuario({
      nomeCompleto: 'Administrador NXT PLAY',
      username: 'admin',
      email: 'admin@nxtplay.com',
      password: 'Admin@123',
      papel: 'admin',
      status: 'ativo'
    });

    const vendedor = await obterUsuario({
      nomeCompleto: 'Vendedor Demonstração',
      username: 'vendedor',
      email: 'vendedor@nxtplay.com',
      password: 'Vendedor@123',
      papel: 'vendedor',
      status: 'ativo'
    });

    const cliente = await obterUsuario({
      nomeCompleto: 'Cliente Demonstração',
      username: 'cliente',
      email: 'cliente@nxtplay.com',
      password: 'Cliente@123',
      papel: 'cliente',
      status: 'ativo'
    });

    await PerfilVendedor.findOrCreate({
      where: {
        usuarioId: vendedor.id
      },
      defaults: {
        usuarioId: vendedor.id,
        nomeLoja: 'NXT Games Store',
        slug: 'nxt-games-store',
        descricao:
          'Consoles, jogos e acessórios selecionados para a comunidade gamer.',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        ativo: true
      }
    });

    const consoles = await obterCategoria({
      nome: 'Consoles',
      slug: 'consoles',
      descricao: 'Consoles atuais e clássicos.',
      ativa: true
    });

    const jogos = await obterCategoria({
      nome: 'Jogos',
      slug: 'jogos',
      descricao: 'Jogos para diferentes plataformas.',
      ativa: true
    });

    const acessorios = await obterCategoria({
      nome: 'Acessórios',
      slug: 'acessorios',
      descricao: 'Controles, headsets e acessórios.',
      ativa: true
    });

    const imagem =
      '/images/produto-placeholder.svg';

    await obterProduto({
      nome: 'Console PlayStation 5 Slim',
      descricao:
        'Console de nova geração com armazenamento SSD e controle sem fio.',
      preco: 3699.90,
      estoque: 8,
      imagem,
      estado: 'ativo',
      destaque: true,
      vendedorId: vendedor.id,
      categoriaId: consoles.id
    });

    await obterProduto({
      nome: 'Xbox Series S',
      descricao:
        'Console compacto e totalmente digital preparado para jogos atuais.',
      preco: 2499.90,
      estoque: 12,
      imagem,
      estado: 'ativo',
      destaque: true,
      vendedorId: vendedor.id,
      categoriaId: consoles.id
    });

    await obterProduto({
      nome: 'Controle sem fio',
      descricao:
        'Controle ergonômico com conexão sem fio e bateria recarregável.',
      preco: 399.90,
      estoque: 20,
      imagem,
      estado: 'ativo',
      destaque: false,
      vendedorId: vendedor.id,
      categoriaId: acessorios.id
    });

    await obterProduto({
      nome: 'Headset Gamer',
      descricao:
        'Headset com som estéreo, microfone ajustável e acabamento confortável.',
      preco: 289.90,
      estoque: 15,
      imagem,
      estado: 'ativo',
      destaque: false,
      vendedorId: vendedor.id,
      categoriaId: acessorios.id
    });

    await obterProduto({
      nome: 'Jogo de aventura',
      descricao:
        'Jogo de aventura em mundo aberto com campanha completa e modo online.',
      preco: 299.90,
      estoque: 18,
      imagem,
      estado: 'ativo',
      destaque: true,
      vendedorId: vendedor.id,
      categoriaId: jogos.id
    });

    console.log('Dados iniciais criados com sucesso.');
    console.log('');
    console.log('Contas para demonstração:');
    console.log('Admin: admin / Admin@123');
    console.log('Vendedor: vendedor / Vendedor@123');
    console.log('Cliente: cliente / Cliente@123');

    void administrador;
    void cliente;
  } catch (erro) {
    console.error(
      'Não foi possível criar os dados iniciais:',
      erro
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

executarSeed();
