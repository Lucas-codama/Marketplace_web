import { Router } from 'express';
import { exigirLogin, exigirPapel } from '../middlewares/auth.js';
import { apiAdicionar, apiAlterar, apiRemover, confirmarCheckout, criarEndereco, detalharPedido, exibirCarrinho, exibirCheckout, listarEnderecos, listarPedidos, removerEndereco } from '../controllers/compraController.js';

const router = Router();
const acessoCliente = [exigirLogin, exigirPapel('cliente')];
router.get('/enderecos', ...acessoCliente, listarEnderecos);
router.post('/enderecos', ...acessoCliente, criarEndereco);
router.post('/enderecos/:id/excluir', ...acessoCliente, removerEndereco);
router.get('/carrinho', ...acessoCliente, exibirCarrinho);
router.post('/api/carrinho/itens', ...acessoCliente, apiAdicionar);
router.patch('/api/carrinho/itens/:id', ...acessoCliente, apiAlterar);
router.delete('/api/carrinho/itens/:id', ...acessoCliente, apiRemover);
router.get('/checkout', ...acessoCliente, exibirCheckout);
router.post('/checkout', ...acessoCliente, confirmarCheckout);
router.get('/pedidos', ...acessoCliente, listarPedidos);
router.get('/pedidos/:id', ...acessoCliente, detalharPedido);

export default router;
