import { Router } from 'express';

import {
  exibirCadastro,
  cadastrar,
  exibirLogin,
  autenticar,
  sair
} from '../controllers/authController.js';

const router = Router();

router.get('/cadastro', exibirCadastro);
router.post('/cadastro', cadastrar);
router.get('/login', exibirLogin);
router.post('/login', autenticar);
router.post('/logout', sair);

export default router;