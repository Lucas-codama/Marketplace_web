import 'dotenv/config';
import { Avaliacao, Categoria, Endereco, HistoricoPedido, ItemPedido, Notificacao, Pedido, PerfilVendedor, Produto, Usuario, sequelize } from '../models/index.js';

const resetarBanco = process.argv.includes('--reset');

async function usuario(dados) {
  const existente = await Usuario.scope('comSenha').findOne({ where: { username: dados.username } });
  if (existente) {
    await existente.update({ nomeCompleto: dados.nomeCompleto, email: dados.email, papel: dados.papel, status: 'ativo' });
    return existente;
  }
  return Usuario.create(dados);
}

async function categoria(nome, slug, descricao) {
  const [item] = await Categoria.findOrCreate({ where: { slug }, defaults: { nome, slug, descricao, ativa: true } });
  return item;
}

async function produto(dados) {
  const [item] = await Produto.findOrCreate({ where: { nome: dados.nome, vendedorId: dados.vendedorId }, defaults: dados });
  if (!item.isNewRecord) await item.update(dados);
  return item;
}

async function executarSeed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: resetarBanco });
    const admin = await usuario({ nomeCompleto: 'Administrador TESTE', username: 'admin', email: 'admin@gmail.com', password: 'Admin123', papel: 'admin', status: 'ativo' });
    
    const vendedor = await usuario({
      nomeCompleto: 'Marina Duarte',
      username: 'vendedor',
      email: 'vendedor@gmail.com',
      password: 'Vendedor123',
      papel: 'vendedor',
      status: 'ativo'
    });

    const vendedor2 = await usuario({
      nomeCompleto: 'Rafael Nogueira',
      username: 'pixelstore',
      email: 'pixel@gmail.com',
      password: 'Vendedor123',
      papel: 'vendedor',
      status: 'ativo'
    });

    const cliente = await usuario({
      nomeCompleto: 'Cliente TESTE',
      username: 'cliente',
      email: 'cliente@gmail.com',
      password: 'Cliente123',
      papel: 'cliente',
      status: 'ativo'
    });

    await PerfilVendedor.findOrCreate({
      where: { usuarioId: vendedor.id },
      defaults: {
        usuarioId: vendedor.id,
        nomeLoja: 'Apex Gear',
        slug: 'apex-gear',
        descricao: 'Hardware, consoles e acessórios escolhidos para quem joga sério.',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        ativo: true
      }
    });

    await PerfilVendedor.findOrCreate({
      where: { usuarioId: vendedor2.id },
      defaults: {
        usuarioId: vendedor2.id,
        nomeLoja: 'Pixel Vault',
        slug: 'pixel-vault',
        descricao: 'Jogos e colecionáveis que merecem espaço na sua estante.',
        cidade: 'São Paulo',
        uf: 'SP',
        ativo: true
      }
    });

    const consoles = await categoria('Consoles', 'consoles', 'Consoles atuais e clássicos.');

    const jogos = await categoria('Jogos', 'jogos', 'Títulos para diferentes plataformas.');

    const acessorios = await categoria('Acessórios', 'acessorios', 'Controles, headsets e acessórios.');

    const colecionaveis = await categoria('Colecionáveis', 'colecionaveis', 'Peças especiais para fãs.');

    const produtos = [];
    
    produtos.push(
      await produto({
        nome: 'PlayStation 5 Slim',
        descricao: 'Console de nova geração com SSD ultrarrápido, áudio 3D e controle DualSense incluso.',
        preco: 3699.90,
        estoque: 8,
        imagem: '/images/ps5.webp',
        estado: 'ativo',
        destaque: true,
        vendedorId: vendedor.id,
        categoriaId: consoles.id
      })
    );
    produtos.push(
      await produto({
        nome: 'Xbox Series S Carbon',
        descricao: 'Console digital compacto com 1 TB de armazenamento, Quick Resume e desempenho de nova geração.',
        preco: 2799.90,
        estoque: 11,
        imagem: '/images/shopping-1.webp',
        estado: 'ativo',
        destaque: true,
        vendedorId: vendedor.id,
        categoriaId: consoles.id
      })
    );
    produtos.push(
      await produto({
        nome: 'Controle Pro',
        descricao: 'Controle sem fio ergonômico com gatilhos ajustáveis, vibração precisa e bateria recarregável.',
        preco: 429.90,
        estoque: 24,
        imagem: '/images/shopping.webp',
        estado: 'ativo',
        destaque: true,
        vendedorId: vendedor.id,
        categoriaId: acessorios.id
      })
    );
    produtos.push(
      await produto({
        nome: 'Headset Pulse Carbon',
        descricao: 'Headset leve com áudio espacial, microfone removível e almofadas respiráveis para sessões longas.',
        preco: 329.90,
        estoque: 16,
        imagem: '/images/images.jpg',
        estado: 'ativo',
        destaque: false,
        vendedorId: vendedor.id,
        categoriaId: acessorios.id
      })
    );
    produtos.push(
      await produto({
        nome: 'Nebula Drift',
        descricao: 'Aventura espacial em mundo aberto com campanha cooperativa, exploração e batalhas cinematográficas.',
        preco: 289.90,
        estoque: 19,
        imagem: '/images/images-1.jpg',
        estado: 'ativo',
        destaque: true,
        vendedorId: vendedor2.id,
        categoriaId: jogos.id
      })
    );
    const [endereco] = await Endereco.findOrCreate({
      where: { usuarioId: cliente.id, apelido: 'Casa' },
      defaults: {
        usuarioId: cliente.id,
        apelido: 'Casa',
        destinatario: cliente.nomeCompleto,
        cep: '30110012',
        logradouro: 'Avenida Afonso Pena',
        numero: '1000',
        bairro: 'Centro',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        principal: true
      }
    });
    let pedido = await Pedido.findOne({ where: { numero: 'NXT-DEMO-001' } });
    if (!pedido) {
      pedido = await Pedido.create({
        numero: 'NXT-DEMO-001',
        clienteId: cliente.id,
        valorTotal: 579.80,
        estado: 'entregue',
        formaPagamento: 'pix',
        formaEntrega: 'padrao',
        enderecoEntrega: endereco.toJSON(),
        observacao: 'Pedido criado para demonstração.'
      });
      const item = await ItemPedido.create({
        pedidoId: pedido.id,
        produtoId: produtos[4].id,
        vendedorId: vendedor2.id,
        nomeProduto: produtos[4].nome,
        precoUnitario: produtos[4].preco,
        quantidade: 2,
        desconto: 0,
        subtotal: 579.80,
        estado: 'entregue'
      });
      await HistoricoPedido.bulkCreate([
        { pedidoId: pedido.id, usuarioResponsavelId: cliente.id, estadoAnterior: null, novoEstado: 'aguardando_confirmacao', observacao: 'Pedido realizado.' },
        { pedidoId: pedido.id, usuarioResponsavelId: vendedor2.id, estadoAnterior: 'aguardando_confirmacao', novoEstado: 'entregue', observacao: 'Entrega concluída.' }
      ]);
      await Avaliacao.create({
        clienteId: cliente.id,
        produtoId: produtos[4].id,
        itemPedidoId: item.id,
        moderadorId: admin.id,
        nota: 5,
        comentario: 'Experiência excelente, entrega rápida e produto exatamente como anunciado.',
        estado: 'aprovada',
        moderadaEm: new Date()
      });
      await Notificacao.bulkCreate([
        {
          usuarioId: cliente.id,
          tipo: 'pedido_atualizado',
          titulo: 'Pedido entregue',
          mensagem: 'Seu pedido NXT-DEMO-001 foi entregue.',
          link: `/pedidos/${pedido.id}`,
          lida: false
        },
        {
          usuarioId: vendedor2.id,
          tipo: 'nova_venda',
          titulo: 'Venda concluída',
          mensagem: 'O pedido NXT-DEMO-001 foi entregue.',
          link: `/vendedor/pedidos/${pedido.id}`,
          lida: false
        }
      ]);
    }
    console.log('Dados iniciais criados com sucesso.');
    console.log('');
    console.log('Contas para demonstração:');
    console.log('Admin: admin / Admin123');
    console.log('Vendedor: vendedor / Vendedor123');
    console.log('Vendedor 2: pixelstore / Vendedor123');
    console.log('Cliente: cliente / Cliente123');
  } catch (erro) {
    console.error('Não foi possível criar os dados iniciais:', erro);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
executarSeed();
