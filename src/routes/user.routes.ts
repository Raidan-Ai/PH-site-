import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, checkRole(['root']), UserController.getAllUsers);
router.put('/:uid/role', authenticateToken, checkRole(['root']), UserController.updateUserRole);
router.delete('/:uid', authenticateToken, checkRole(['root']), UserController.deleteUser);

export default router;
