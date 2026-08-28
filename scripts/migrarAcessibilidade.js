import sequelize from '../config/database.js';

/*
 * Migração pontual: adiciona as colunas novas usadas pelas
 * preferências de acessibilidade AAA (cores personalizadas e
 * pausa de notificações) sem apagar dados existentes.
 *
 * Uso: node scripts/migrarAcessibilidade.js
 * Pode ser executado quantas vezes quiser — colunas já existentes
 * são ignoradas.
 */

const colunasNovas = [
  { nome: 'cor_texto', definicao: 'VARCHAR(7)' },
  { nome: 'cor_fundo', definicao: 'VARCHAR(7)' },
  { nome: 'notificacoes_pausadas', definicao: 'BOOLEAN NOT NULL DEFAULT 0' }
];

async function migrar() {
  await sequelize.authenticate();

  const [colunasExistentes] = await sequelize.query('PRAGMA table_info(usuarios);');
  const nomesExistentes = colunasExistentes.map((coluna) => coluna.name);

  for (const coluna of colunasNovas) {
    if (nomesExistentes.includes(coluna.nome)) {
      console.log(`- Coluna "${coluna.nome}" já existe, pulando.`);
      continue;
    }

    await sequelize.query(`ALTER TABLE usuarios ADD COLUMN ${coluna.nome} ${coluna.definicao};`);
    console.log(`+ Coluna "${coluna.nome}" adicionada.`);
  }

  console.log('Migração concluída.');
  await sequelize.close();
}

migrar().catch((erro) => {
  console.error('Falha na migração:', erro);
  process.exit(1);
});
