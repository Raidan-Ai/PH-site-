import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', ProjectController.getAll);
router.post('/', authenticateToken, checkRole(['root', 'admin']), ProjectController.create);
router.put('/:id', authenticateToken, checkRole(['root', 'admin']), ProjectController.update);
router.delete('/:id', authenticateToken, checkRole(['root', 'admin']), ProjectController.delete);

export default router;
