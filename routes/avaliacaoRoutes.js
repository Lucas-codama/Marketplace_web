import { Router } from 'express';
import { exigirLogin, exigirPapel } from '../middlewares/auth.js';
import { apiCriar, apiListar, formulario } from '../controllers/avaliacaoController.js';

const router = Router();
router.get('/api/produtos/:id/avaliacoes', apiListar);
router.get('/produtos/:id/avaliar', exigirLogin, exigirPapel('cliente'), formulario);
router.post('/api/produtos/:id/avaliacoes', exigirLogin, exigirPapel('cliente'), apiCriar);

export default router;
