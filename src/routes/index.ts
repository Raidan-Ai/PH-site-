import { Router } from 'express';
import authRoutes from './auth.routes';
import articleRoutes from './article.routes';
import mediaRoutes from './media.routes';
import aiRoutes from './ai.routes';
import projectRoutes from './project.routes';
import academyRoutes from './academy.routes';
import settingsRoutes from './settings.routes';
import userRoutes from './user.routes';
import jobRoutes from './job.routes';
import eventRoutes from './event.routes';
import tenderRoutes from './tender.routes';
import observatoryRoutes from './observatory.routes';
import systemRoutes from './system.routes';
import videoRoutes from './video.routes';

const router = Router();

router.get('/test', (req, res) => res.json({ ok: true }));
router.use('/', systemRoutes);
router.use('/settings', settingsRoutes);
router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/media', mediaRoutes);
router.use('/ai', aiRoutes);
router.use('/projects', projectRoutes);
router.use('/academy', academyRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/events', eventRoutes);
router.use('/tenders', tenderRoutes);
router.use('/observatory', observatoryRoutes);
router.use('/violations', observatoryRoutes);
router.use('/videos', videoRoutes);

// Catch-all for unmatched API routes
router.use((req, res) => {
  console.log(`[404 API] ${req.method} ${req.url}`);
  res.status(404).json({ message: `API route not found: ${req.url}` });
});

export default router;
