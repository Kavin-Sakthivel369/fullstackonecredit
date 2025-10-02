import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

router.get('/', requireAuth, requireRole(['BROKER']), async (req, res) => {
  const items = await prisma.brokerage.findMany({ where: { brokerId: req.user!.id }, include: { job: true } });
  res.json({ items });
});

const assignSchema = z.object({
  jobId: z.string().min(1),
  feePct: z.number().int().min(0).max(100).default(10),
});

// Assign broker to a job (owner only)
router.post('/assign', requireAuth, requireRole(['OWNER']), async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, ownerId: req.user!.id } });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  // naive: assign the first broker user
  const broker = await prisma.user.findFirst({ where: { role: 'BROKER' } });
  if (!broker) return res.status(400).json({ error: 'No broker available' });
  const existing = await prisma.brokerage.findUnique({ where: { jobId: job.id } });
  if (existing) return res.status(409).json({ error: 'Broker already assigned' });
  const br = await prisma.brokerage.create({ data: { jobId: job.id, brokerId: broker.id, feePct: parsed.data.feePct } });
  res.status(201).json(br);
});

export default router;
