import { Router } from 'express';
import { TenderController } from '../controllers/tender.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', TenderController.getAll);
router.post('/', authenticateToken, checkRole(['root', 'admin']), TenderController.create);
router.put('/:id', authenticateToken, checkRole(['root', 'admin']), TenderController.update);
router.delete('/:id', authenticateToken, checkRole(['root', 'admin']), TenderController.delete);

export default router;
