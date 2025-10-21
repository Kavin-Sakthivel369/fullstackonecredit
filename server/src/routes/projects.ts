import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { authenticate, requireRole, AuthedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// List open projects (for any authenticated user)
router.get('/projects', async (_req, res) => {
  const projects = await prisma.project.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

// Owner: list my projects with applications and assignments
router.get('/projects/mine', requireRole(['OWNER']), async (req: AuthedRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: {
      assignments: { include: { worker: { select: { id: true, name: true, email: true } } } },
      applications: true,
    },
  });
  res.json(projects);
});

// Owner: create project
const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

router.post('/projects', requireRole(['OWNER']), async (req: AuthedRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      ownerId: req.user!.id,
    },
  });
  res.status(201).json(project);
});

// Owner: update project
const projectUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
});

router.put('/projects/:id', requireRole(['OWNER']), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== req.user!.id) return res.status(404).json({ error: 'Not found' });
  const parsed = projectUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.project.update({ where: { id }, data: parsed.data });
  res.json(updated);
});

// Owner: delete project
router.delete('/projects/:id', requireRole(['OWNER']), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== req.user!.id) return res.status(404).json({ error: 'Not found' });
  await prisma.assignment.deleteMany({ where: { projectId: id } });
  await prisma.application.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });
  res.json({ success: true });
});

// Worker: list my assignments
router.get('/projects/assigned', requireRole(['WORKER']), async (req: AuthedRequest, res) => {
  const assignments = await prisma.assignment.findMany({
    where: { workerId: req.user!.id },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assignments);
});

// Worker: apply to a project
const applySchema = z.object({ coverNote: z.string().optional() });
router.post('/projects/:id/apply', requireRole(['WORKER']), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.status !== 'OPEN') return res.status(400).json({ error: 'Project not open' });
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const app = await prisma.application.create({ data: { projectId: id, workerId: req.user!.id, coverNote: parsed.data.coverNote } });
    res.status(201).json(app);
  } catch {
    return res.status(409).json({ error: 'Already applied' });
  }
});

// Owner/Admin: view applications for a project
router.get('/projects/:id/applications', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role === 'OWNER' && project.ownerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  const apps = await prisma.application.findMany({
    where: { projectId: id },
    include: { worker: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(apps);
});

// Owner/Admin: view assignments for a project
router.get('/projects/:id/assignments', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role === 'OWNER' && project.ownerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  const assigns = await prisma.assignment.findMany({
    where: { projectId: id },
    include: { worker: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assigns);
});

export default router;
