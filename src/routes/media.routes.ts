import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', MediaController.getAll);
router.post('/upload', authenticateToken, upload.single('file'), MediaController.upload);
router.put('/:id', authenticateToken, MediaController.update);
router.delete('/:id', authenticateToken, MediaController.delete);

export default router;
