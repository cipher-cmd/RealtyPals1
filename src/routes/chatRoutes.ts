import { Router } from 'express';
import { handleChat, getIntent, resetIntent } from '../controllers/chatController';

const router = Router();

router.post('/', handleChat);
router.get('/intent', getIntent);
router.delete('/intent', resetIntent);

export default router;
