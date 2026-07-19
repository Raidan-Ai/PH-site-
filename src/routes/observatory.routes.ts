import { Router } from 'express';
import { ObservatoryController } from '../controllers/observatory.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', ObservatoryController.getAllViolations);
router.post('/', ObservatoryController.submitViolation);
router.get('/violations', ObservatoryController.getAllViolations); // Keep for compatibility if needed
router.post('/violations', ObservatoryController.submitViolation); // Keep for compatibility if needed
router.post('/jpt/case-draft', authenticateToken, ObservatoryController.getCaseDraft);

export default router;
