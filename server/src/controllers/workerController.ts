import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listWorkers(_req: Request, res: Response) {
  const workers = await prisma.worker.findMany({ include: { user: true } });
  return res.json(workers);
}

export async function upsertWorkerProfile(req: Request, res: Response) {
  const { skill, experience, phone, address } = req.body as { skill: string; experience?: string; phone?: string; address?: string };
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const userId = req.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'worker') return res.status(403).json({ message: 'Only workers can edit profile' });
  const existing = await prisma.worker.findUnique({ where: { userId } });
  const saved = existing
    ? await prisma.worker.update({ where: { userId }, data: { skill, experience, phone, address } })
    : await prisma.worker.create({ data: { userId, skill, experience, phone, address } });
  return res.json(saved);
}

export async function applyForProject(req: Request, res: Response) {
  const { projectId } = req.body as { projectId: number };
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const userId = req.user.id;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  // simplistic: mark status to 'applied' and store lastApplicantId
  const updated = await prisma.project.update({ where: { id: projectId }, data: { status: 'applied', lastApplicantId: userId } });
  return res.json(updated);
}
