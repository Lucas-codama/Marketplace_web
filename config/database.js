import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';

const storage =
  process.env.DATABASE_STORAGE || './database/nxtplay.sqlite';

if (storage !== ':memory:') {
  const caminhoAbsoluto = path.resolve(storage);
  const pastaDoBanco = path.dirname(caminhoAbsoluto);

  fs.mkdirSync(pastaDoBanco, {
    recursive: true
  });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

export default sequelize;