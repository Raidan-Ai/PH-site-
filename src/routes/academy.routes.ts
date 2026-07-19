import { Router } from 'express';
import { AcademyController } from '../controllers/academy.controller';
import { authenticateToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/courses', AcademyController.getAllCourses);
router.post('/courses', authenticateToken, checkRole(['root', 'admin']), AcademyController.createCourse);
router.post('/apply', AcademyController.submitApplication);
router.get('/applications', authenticateToken, checkRole(['root', 'admin']), AcademyController.getApplications);

export default router;
