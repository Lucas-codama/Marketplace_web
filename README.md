# NXT PLAY Marketplace

Marketplace multi-vendedor voltado para produtos de consoles, jogos, acessórios e colecionáveis.

## Tecnologias utilizadas

* Node.js
* Express 5
* EJS
* Bootstrap 5
* jQuery
* Sequelize
* SQLite
* Socket.IO
* express-session
* bcryptjs
* Multer

## Requisitos

* Node.js instalado
* npm instalado

## Como executar o projeto

1. Abra um terminal na pasta do projeto.
2. Instale as dependências:

```bash
npm install
```

3. Crie o banco e os dados de demonstração:

```bash
npm run db:reset
```

4. Inicie a aplicação:

```bash
npm start
```

5. Acesse no navegador:

```text
http://localhost:3000
```

## Contas para demonstração

| Perfil        | Usuário      | Senha         |
| ------------- | ------------ | ------------- |
| Administrador | `admin`      | `Admin123`    |
| Vendedor      | `vendedor`   | `Vendedor123` |
| Vendedor 2    | `pixelstore` | `Vendedor123` |
| Cliente       | `cliente`    | `Cliente123`  |

Essas contas são criadas exclusivamente pelo script de seed para demonstração local.

## Perfis de usuário

### Cliente

Pode navegar pelo catálogo, visualizar produtos e vendedores, gerenciar endereços, utilizar o carrinho, finalizar compras, acompanhar pedidos, receber notificações e avaliar produtos comprados.

### Vendedor

Pode administrar seus produtos, estoque e pedidos, acompanhar avaliações recebidas e receber notificações de novas vendas.

### Administrador

Pode gerenciar usuários, vendedores, categorias, produtos, avaliações e pedidos.

## Comunicação em tempo real

O projeto utiliza Socket.IO integrado à sessão do Express. Os principais eventos são:

* `nova_venda`: avisa o vendedor quando recebe uma nova venda;
* `pedido_atualizado`: avisa o cliente quando o estado do pedido muda;
* `estoque_atualizado`: atualiza o estoque exibido na página do produto sem recarregar a página.

## Banco de dados

O projeto utiliza SQLite com Sequelize ORM. Principais entidades:

* Usuario
* PerfilVendedor
* Categoria
* Produto
* Endereco
* Carrinho
* ItemCarrinho
* Pedido
* ItemPedido
* HistoricoPedido
* Notificacao
* Avaliacao

## Acessibilidade

O projeto possui alto contraste, escala de fonte, personalização de cores, navegação por teclado, mapa do site, mensagens acessíveis para tecnologias assistivas e opção de pausar atualizações automáticas.

Há testes automatizados relacionados a critérios de acessibilidade:

```bash
npm test
```

## Scripts disponíveis

```bash
npm start
npm run dev
npm test
npm run db:seed
npm run db:reset
npm run db:migrar-acessibilidade
npm run admin:promote
```

## Variáveis de ambiente

Exemplo disponível em `.env.example`:

```env
PORT=3000
SESSION_SECRET=troque-por-uma-chave-grande
DATABASE_STORAGE=./database/nxtplay.sqlite
NODE_ENV=development
```

## Estrutura principal

```text
config/       Configurações de banco, sessão e uploads
controllers/  Controladores
middlewares/  Autenticação, autorização e erros
models/       Modelos Sequelize e relacionamentos
public/       CSS, JavaScript, imagens e arquivos públicos
routes/       Rotas HTTP
scripts/      Seed, migração e utilitários
services/     Regras de negócio e serviços
sockets/      Configuração do Socket.IO
test/         Testes automatizados
views/        Páginas EJS
app.js        Configuração do Express
server.js     Inicialização HTTP, banco e Socket.IO
```