import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', SettingsController.getSettings);
router.put('/', authenticateToken, checkRole(['root']), SettingsController.updateSettings);

export default router;
