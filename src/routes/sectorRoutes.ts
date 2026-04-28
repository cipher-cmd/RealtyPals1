import { Router } from 'express';
import { getSectors } from '../controllers/sectorController';

const router = Router();

router.get('/', getSectors);

export default router;
