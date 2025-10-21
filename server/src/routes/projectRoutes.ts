import { Router } from 'express';
import { listProjects, createProject, updateProject, deleteProject } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.get('/', listProjects);
router.post('/', authenticate, authorize(['owner']), createProject);
router.put('/:id', authenticate, authorize(['owner','admin']), updateProject);
router.delete('/:id', authenticate, authorize(['owner','admin']), deleteProject);

export default router;
