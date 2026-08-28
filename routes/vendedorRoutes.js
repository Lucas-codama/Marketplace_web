import { Router } from 'express';
import { exigirLogin, exigirPapel } from '../middlewares/auth.js';
import { produtoDoVendedor } from '../middlewares/proprietarioProduto.js';
import { uploadProduto } from '../config/upload.js';
import {
  apiEstadoPedido,
  apiEstoque,
  avaliacoesRecebidas,
  criarProduto,
  editarProduto,
  estadoProduto,
  estoque,
  excluirProduto,
  listarProdutos,
  novoProduto,
  painel,
  pedido,
  pedidos,
  salvarProduto
} from '../controllers/vendedorController.js';

const router = Router();
const acessoVendedor = [exigirLogin, exigirPapel('vendedor')];
router.get('/vendedor', ...acessoVendedor, painel);
router.get('/vendedor/produtos', ...acessoVendedor, listarProdutos);
router.get('/vendedor/produtos/novo', ...acessoVendedor, novoProduto);
router.post('/vendedor/produtos', ...acessoVendedor, uploadProduto.single('imagem'), criarProduto);
router.get('/vendedor/produtos/:id/editar', ...acessoVendedor, produtoDoVendedor, editarProduto);
router.post('/vendedor/produtos/:id/editar', ...acessoVendedor, produtoDoVendedor, uploadProduto.single('imagem'), salvarProduto);
router.post('/vendedor/produtos/:id/estado', ...acessoVendedor, produtoDoVendedor, estadoProduto);
router.post('/vendedor/produtos/:id/excluir', ...acessoVendedor, produtoDoVendedor, excluirProduto);
router.get('/vendedor/estoque', ...acessoVendedor, estoque);
router.patch('/api/vendedor/produtos/:id/estoque', ...acessoVendedor, produtoDoVendedor, apiEstoque);
router.get('/vendedor/pedidos', ...acessoVendedor, pedidos);
router.get('/vendedor/pedidos/:id', ...acessoVendedor, pedido);
router.patch('/api/vendedor/pedidos/:id/estado', ...acessoVendedor, apiEstadoPedido);
router.get('/vendedor/avaliacoes', ...acessoVendedor, avaliacoesRecebidas);

export default router;
