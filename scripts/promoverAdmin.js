import 'dotenv/config';
import sequelize from '../config/database.js';
import { Usuario } from '../models/index.js';

const username = String(process.argv[2] || '').trim().toLowerCase();

if (!username) {
  console.error('Uso: npm run admin:promote -- username');
  process.exit(1);
}

try {
  await sequelize.authenticate();
  const usuario = await Usuario.findOne({
    where: {username}
  });

  if (!usuario) {
    console.error(`Usuário "${username}" não encontrado.`);
    process.exitCode = 1;

  } else {
    await usuario.update({papel: 'admin', status: 'ativo'});
    console.log(`Usuário "${username}" promovido para administrador.`);

  }
} catch (erro) {
  console.error('Não foi possível promover o usuário:', erro);
  process.exitCode = 1;
  
} finally {
  await sequelize.close();
}