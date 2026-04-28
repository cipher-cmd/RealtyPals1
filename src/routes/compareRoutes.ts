import { Router } from 'express';
import { compare } from '../controllers/compareController';

const router = Router();

router.post('/', compare);

export default router;
