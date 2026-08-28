import { Router } from 'express';
import { exigirLogin } from '../middlewares/auth.js';
import { pagina, salvarPreferencias } from '../controllers/acessibilidadeController.js';

const router = Router();

router.get('/acessibilidades', pagina);
router.patch('/api/acessibilidade', exigirLogin, salvarPreferencias);

export default router;