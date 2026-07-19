import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/chat', AIController.chat);
router.post('/translate', AIController.translate);
router.post('/admin-chat', authenticateToken, AIController.chat);

export default router;
