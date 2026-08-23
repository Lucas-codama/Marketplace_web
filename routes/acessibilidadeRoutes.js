import { Router } from 'express';
import { pagina } from '../controllers/acessibilidadeController.js';

const router = Router();

router.get('/acessibilidades', pagina);

export default router;
