import { Router } from 'express';
import { listWorkers, upsertWorkerProfile, applyForProject } from '../controllers/workerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.get('/', listWorkers);
router.post('/profile', authenticate, authorize(['worker']), upsertWorkerProfile);
router.post('/apply', authenticate, authorize(['worker']), applyForProject);

export default router;
