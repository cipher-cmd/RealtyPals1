import { Router } from 'express';
import { checkValue } from '../controllers/valueCheckController';

const router = Router();

router.post('/', checkValue);

export default router;
