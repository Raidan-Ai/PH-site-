import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';

const router = Router();

router.get('/menus', SystemController.getMenus);
router.get('/page-content/:page', SystemController.getPageContent);
router.get('/analytics/comprehensive', SystemController.getStats);
router.get('/analytics/indicators', SystemController.getIndicators);
router.get('/institution-identity', SystemController.getIdentity);
router.get('/heroSlides', SystemController.getHeroSlides);
router.get('/dynamic-hero-slides', SystemController.getDynamicHeroSlides);

export default router;
