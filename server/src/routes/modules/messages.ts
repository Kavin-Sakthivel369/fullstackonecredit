import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const jobId = req.query.jobId as string | undefined;

  let where: any = {
    OR: [
      { senderId: req.user!.id },
      { job: { ownerId: req.user!.id } },
      { job: { brokerage: { brokerId: req.user!.id } } },
    ],
  };

  if (jobId) {
    where = { AND: [where, { jobId }] };
  }

  const items = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ items });
});

const sendSchema = z.object({
  jobId: z.string().min(1),
  content: z.string().min(1),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const msg = await prisma.message.create({ data: { ...parsed.data, senderId: req.user!.id } });
  res.status(201).json(msg);
});

export default router;
