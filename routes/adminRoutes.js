import { Router } from 'express';
import {exigirLogin, exigirPapel} from '../middlewares/auth.js';

const router = Router();

router.get('/', exigirLogin, exigirPapel('admin'), (req, res) => {
    return res.renderComLayout('admin/index',{
        titulo:'Painel administrativo'
      }
    );
  }
);

export default router;