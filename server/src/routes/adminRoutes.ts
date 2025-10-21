import { Router } from 'express';
import { listUsers, approveUser, assignWorker } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize(['admin']));
router.get('/users', listUsers);
router.post('/approve', approveUser);
router.post('/assign', assignWorker);

export default router;
