import { Router } from 'express';
import { Categoria, Produto } from '../models/index.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [destaques, recentes, categorias] = await Promise.all([
      Produto.findAll({ where: { estado: 'ativo', destaque: true }, limit: 4, order: [['createdAt', 'DESC']] }),
      Produto.findAll({ where: { estado: 'ativo' }, limit: 4, order: [['createdAt', 'DESC']] }),
      Categoria.findAll({ where: { ativa: true }, limit: 6, order: [['nome', 'ASC']] })
    ]);
    return res.renderComLayout('inicio', { titulo: 'Início', destaques, recentes, categorias });
  } catch (erro) { return next(erro); }
});

router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    aplicacao: 'NXT PLAY'
  });
});

export default router;
