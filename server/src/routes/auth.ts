import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { JWT_SECRET, BCRYPT_SALT_ROUNDS } from '../config';

const prisma = new PrismaClient();
const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['OWNER', 'WORKER'])
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, name, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({ data: { email, password: hashed, name, role, approved: false } });
  if (role === 'WORKER') {
    await prisma.workerProfile.create({ data: { userId: user.id, skills: '' } });
  }
  return res.status(201).json({ message: 'Registered. Awaiting approval by admin.' });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.approved && user.role !== 'ADMIN') return res.status(403).json({ error: 'Account pending approval' });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default router;
