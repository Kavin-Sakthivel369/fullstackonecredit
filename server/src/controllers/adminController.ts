import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  return res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, approved: u.approved })));
}

export async function approveUser(req: Request, res: Response) {
  const { userId, approved } = req.body as { userId: number; approved: boolean };
  if (typeof userId !== 'number') return res.status(400).json({ message: 'userId required' });
  const user = await prisma.user.update({ where: { id: userId }, data: { approved: approved ?? true } });
  return res.json({ id: user.id, approved: user.approved });
}

export async function assignWorker(req: Request, res: Response) {
  const { projectId, workerUserId } = req.body as { projectId: number; workerUserId: number };
  if (!projectId || !workerUserId) return res.status(400).json({ message: 'projectId and workerUserId required' });
  const worker = await prisma.user.findUnique({ where: { id: workerUserId } });
  if (!worker || worker.role !== 'worker') return res.status(400).json({ message: 'Invalid worker' });
  const updated = await prisma.project.update({ where: { id: projectId }, data: { assignedWorkerId: workerUserId, status: 'assigned' } });
  return res.json(updated);
}
