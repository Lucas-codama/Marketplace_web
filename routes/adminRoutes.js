import { Router } from 'express';
import { exigirLogin, exigirPapel } from '../middlewares/auth.js';
import {
  avaliacoes,
  categorias,
  criarCategoria,
  editarCategoria,
  estadoProduto,
  moderarAvaliacao,
  painel,
  pedidos,
  produtos,
  statusUsuario,
  statusVendedor,
  usuarios,
  vendedores
} from '../controllers/adminController.js';

const router = Router();
router.use(exigirLogin, exigirPapel('admin'));
router.get('/', painel);
router.get('/usuarios', usuarios);
router.patch('/api/usuarios/:id/status', statusUsuario);
router.get('/vendedores', vendedores);
router.patch('/api/vendedores/:id/status', statusVendedor);
router.get('/categorias', categorias);
router.post('/categorias', criarCategoria);
router.post('/categorias/:id/editar', editarCategoria);
router.get('/produtos', produtos);
router.patch('/api/produtos/:id/estado', estadoProduto);
router.get('/avaliacoes', avaliacoes);
router.patch('/api/avaliacoes/:id/moderacao', moderarAvaliacao);
router.get('/pedidos', pedidos);

export default router;
