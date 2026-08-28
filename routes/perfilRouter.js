import { Router } from 'express';
import {exibirPerfil, atualizarPerfil, alterarSenha, atualizarPerfilVendedor } from '../controllers/perfilController.js';
import { exigirLogin, exigirPapel } from '../middlewares/auth.js';

const router = Router();

router.use(exigirLogin);
router.get('/', exibirPerfil);
router.post('/', atualizarPerfil);
router.post('/senha', alterarSenha);
router.post('/vendedor', exigirPapel('vendedor'), atualizarPerfilVendedor);

export default router;