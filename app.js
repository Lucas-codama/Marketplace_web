import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sessionMiddleware from './config/session.js';
import { flashMiddleware } from './middlewares/flash.js';
import { naoEncontrado, tratarErro } from './middlewares/erros.js';
import rotasPrincipais from './routes/index.js';
import { carregarUsuarioDaSessao } from './middlewares/auth.js';

import authRoutes from './routes/authRoutes.js';
import perfilRouter from './routes/perfilRouter.js';
import adminRoutes from './routes/adminRoutes.js';
import catalogoRoutes from './routes/catalogoRoutes.js';
import compraRoutes from './routes/compraRoutes.js';
import vendedorRoutes from './routes/vendedorRoutes.js';
import avaliacaoRoutes from './routes/avaliacaoRoutes.js';
import notificacaoRoutes from './routes/notificacaoRoutes.js';
import acessibilidadeRoutes from './routes/acessibilidadeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

app.use('/vendor/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));

app.use(sessionMiddleware);
app.use(flashMiddleware);

app.use((req, res, next) => {
  res.locals.usuario = null;
  res.locals.caminhoAtual = req.path;
  res.locals.moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  next();
});

app.use((req, res, next) => {
  res.renderComLayout = function renderComLayout(view, dados = {}) {
    const dadosDaPagina = {
      ...res.locals,
      ...dados
    };

    res.render(view, dadosDaPagina, (erroDaPagina, htmlDaPagina) => {
      if (erroDaPagina) {
        return next(erroDaPagina);
      }

      return res.render(
        'layout',
        {
          ...dadosDaPagina,
          body: htmlDaPagina
        },
        (erroDoLayout, htmlCompleto) => {
          if (erroDoLayout) {
            return next(erroDoLayout);
          }
          return res.send(htmlCompleto);
        }
      );
    });
  };

  next();
});

app.use(carregarUsuarioDaSessao);

app.use('/', rotasPrincipais);
app.use('/', authRoutes);
app.use('/', catalogoRoutes);
app.use('/perfil', perfilRouter);
app.use('/admin', adminRoutes);
app.use('/', compraRoutes);
app.use('/', vendedorRoutes);
app.use('/', avaliacaoRoutes);
app.use('/', notificacaoRoutes);
app.use('/', acessibilidadeRoutes);
app.use(naoEncontrado);
app.use(tratarErro);

export default app;
