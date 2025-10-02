import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

router.get('/', async (_req, res) => {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: { id: true, fullName: true } } },
  });
  res.json({ items: jobs });
});

const jobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  category: z.string().min(2),
  budget: z.number().int().positive().optional(),
});

router.post('/', requireAuth, requireRole(['OWNER']), async (req, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const job = await prisma.job.create({
    data: { ...parsed.data, ownerId: req.user!.id },
  });
  res.status(201).json(job);
});

router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

export default router;
