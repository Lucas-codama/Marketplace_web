import { Router } from 'express';
import { detalharProduto, listarCatalogo, perfilPublicoVendedor } from '../controllers/catalogoController.js';

const router = Router();
router.get('/catalogo', listarCatalogo);
router.get('/api/catalogo', listarCatalogo);
router.get('/produtos/:id', detalharProduto);
router.get('/vendedores/:slug', perfilPublicoVendedor);

export default router;
