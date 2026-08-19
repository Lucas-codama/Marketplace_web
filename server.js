import 'dotenv/config';

import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import sequelize from './config/database.js';
import sessionMiddleware from './config/session.js';
import configurarSockets from './sockets/index.js';
import { configurarTempoReal } from './services/tempoRealService.js';

const porta = Number(process.env.PORT) || 3000;

const servidorHttp = http.createServer(app);

const io = new Server(servidorHttp);

/*
 * Faz o Socket.IO utilizar a mesma sessão
 * usada pelo Express.
 */
io.engine.use(sessionMiddleware);

configurarSockets(io);
configurarTempoReal(io);

/*
 * Permite que controladores futuros recuperem
 * o Socket.IO usando req.app.get('io').
 */
app.set('io', io);

async function iniciarServidor() {
  try {
    await sequelize.authenticate();

    /*
     * Cria tabelas que ainda não existem,
     * sem apagar os dados existentes.
     */
    await sequelize.sync();

    servidorHttp.listen(porta, () => {
      console.log(`NXT PLAY disponível em http://localhost:${porta}`);
    });
  } catch (erro) {
    console.error('Não foi possível iniciar o servidor:', erro);

    process.exit(1);
  }
}

async function encerrarServidor() {
  console.log('\nEncerrando o servidor...');

  servidorHttp.close(async () => {
    await sequelize.close();

    process.exit(0);
  });
}

process.on('SIGINT', encerrarServidor);

process.on('SIGTERM', encerrarServidor);

iniciarServidor();
