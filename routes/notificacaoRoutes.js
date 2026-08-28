import { Router } from 'express';
import { exigirLogin } from '../middlewares/auth.js';
import { contar, listar, marcar, marcarTodas } from '../controllers/notificacaoController.js';

const router = Router();
router.get('/notificacoes', exigirLogin, listar);
router.get('/api/notificacoes/nao-lidas', exigirLogin, contar);
router.patch('/api/notificacoes/marcar-todas/lidas', exigirLogin, marcarTodas);
router.patch('/api/notificacoes/:id/lida', exigirLogin, marcar);

export default router;
