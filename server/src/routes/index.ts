import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import workerRoutes from './workerRoutes';
import adminRoutes from './adminRoutes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/workers', workerRoutes);
router.use('/admin', adminRoutes);

export default router;
