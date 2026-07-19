import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', EventController.getAll);
router.post('/', authenticateToken, checkRole(['root', 'admin']), EventController.create);
router.put('/:id', authenticateToken, checkRole(['root', 'admin']), EventController.update);
router.delete('/:id', authenticateToken, checkRole(['root', 'admin']), EventController.delete);

export default router;
