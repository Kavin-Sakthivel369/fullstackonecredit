import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { authenticate, requireRole, AuthedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate, requireRole(['ADMIN']));

// List all users
router.get('/admin/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, approved: true },
  });
  res.json(users);
});

// Approve or reject a user
const approveSchema = z.object({ approved: z.boolean() });
router.put('/admin/users/:id/approve', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const parsed = approveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.user.update({ where: { id }, data: { approved: parsed.data.approved } });
  res.json({ id: updated.id, approved: updated.approved });
});

// Assign a worker to a project
const assignSchema = z.object({ workerId: z.number() });
router.post('/admin/projects/:id/assign', async (req: AuthedRequest, res) => {
  const projectId = Number(req.params.id);
  if (Number.isNaN(projectId)) return res.status(400).json({ error: 'Invalid id' });
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const worker = await prisma.user.findUnique({ where: { id: parsed.data.workerId } });
  if (!worker || worker.role !== 'WORKER' || !worker.approved) return res.status(400).json({ error: 'Invalid worker' });
  await prisma.assignment.create({ data: { projectId, workerId: worker.id } });
  await prisma.project.update({ where: { id: projectId }, data: { status: 'ASSIGNED' } });
  res.status(201).json({ success: true });
});

// Admin: register user on behalf (owner or worker)
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['OWNER', 'WORKER']),
  approved: z.boolean().default(true),
  skills: z.string().optional(),
  bio: z.string().optional(),
});
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config';

router.post('/admin/users', async (req: AuthedRequest, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, name, role, approved, skills, bio } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, password: hashed, name, role, approved } });
  if (role === 'WORKER') {
    await prisma.workerProfile.create({ data: { userId: user.id, skills: skills || '', bio } });
  }
  res.status(201).json({ id: user.id });
});

export default router;
