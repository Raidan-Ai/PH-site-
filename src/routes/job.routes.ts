import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', JobController.getAll);
router.post('/', authenticateToken, checkRole(['root', 'admin']), JobController.create);
router.put('/:id', authenticateToken, checkRole(['root', 'admin']), JobController.update);
router.delete('/:id', authenticateToken, checkRole(['root', 'admin']), JobController.delete);

export default router;
