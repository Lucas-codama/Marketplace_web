import { Router } from 'express';
import {exibirPerfil, atualizarPerfil, alterarSenha } from '../controllers/perfilController.js';
import { exigirLogin } from '../middlewares/auth.js';

const router = Router();

router.use(exigirLogin);
router.get('/', exibirPerfil);
router.post('/', atualizarPerfil);
router.post('/senha', alterarSenha);

export default router;