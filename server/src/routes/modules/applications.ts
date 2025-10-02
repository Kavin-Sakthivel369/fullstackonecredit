import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const jobId = req.query.jobId as string | undefined;

  let where: any = {};

  if (jobId) {
    where.jobId = jobId;
    if (req.user!.role === 'WORKER') {
      where.workerId = req.user!.id;
    } else if (req.user!.role === 'OWNER') {
      where.job = { ownerId: req.user!.id };
    }
  } else {
    if (req.user!.role === 'WORKER') {
      where.workerId = req.user!.id;
    } else if (req.user!.role === 'OWNER') {
      where.job = { ownerId: req.user!.id };
    } else {
      where.job = { brokerage: { brokerId: req.user!.id } };
    }
  }

  const items = await prisma.application.findMany({
    where,
    include: {
      worker: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ items });
});

const applySchema = z.object({
  jobId: z.string().min(1),
  coverNote: z.string().optional(),
});

router.post('/', requireAuth, requireRole(['WORKER']), async (req, res) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { jobId, coverNote } = parsed.data;
  const exists = await prisma.application.findFirst({ where: { jobId, workerId: req.user!.id } });
  if (exists) return res.status(409).json({ error: 'Already applied' });
  const app = await prisma.application.create({ data: { jobId, workerId: req.user!.id, coverNote } });
  res.status(201).json(app);
});

export default router;
