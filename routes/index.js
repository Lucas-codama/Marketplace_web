import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  return res.renderComLayout('inicio', {
    titulo: 'NXT PLAY'
  });
});

router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    aplicacao: 'NXT PLAY'
  });
});

export default router;