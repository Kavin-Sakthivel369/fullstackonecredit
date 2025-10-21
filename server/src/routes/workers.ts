import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { authenticate, requireRole, AuthedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// Worker: get my profile
router.get('/workers/me', requireRole(['WORKER']), async (req: AuthedRequest, res) => {
  const profile = await prisma.workerProfile.findUnique({ where: { userId: req.user!.id } });
  res.json(profile);
});

// Worker: update profile (skills, bio)
const profileSchema = z.object({
  skills: z.string().default(''),
  bio: z.string().optional(),
});

router.put('/workers/me', requireRole(['WORKER']), async (req: AuthedRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.workerProfile.update({
    where: { userId: req.user!.id },
    data: { skills: parsed.data.skills, bio: parsed.data.bio },
  });
  res.json(updated);
});

// Public to authenticated: list workers (approved only)
router.get('/workers', async (_req, res) => {
  const workers = await prisma.user.findMany({
    where: { role: 'WORKER', approved: true },
    select: { id: true, name: true, email: true, workerProfile: { select: { skills: true, bio: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(workers);
});

export default router;
