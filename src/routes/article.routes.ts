import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', ArticleController.getAll);
router.get('/author/stats', authenticateToken, ArticleController.getAuthorStats);
router.patch('/:id/view', ArticleController.incrementView);
router.get('/:id', ArticleController.getOne);
router.post('/', authenticateToken, checkRole(['root', 'admin', 'editor', 'journalist']), ArticleController.create);
router.put('/:id', authenticateToken, checkRole(['root', 'admin', 'editor', 'journalist']), ArticleController.update);
router.delete('/:id', authenticateToken, checkRole(['root', 'admin', 'editor']), ArticleController.delete);

export default router;
