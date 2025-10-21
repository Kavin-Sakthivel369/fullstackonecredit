import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listProjects(_req: Request, res: Response) {
  const projects = await prisma.project.findMany({ include: { owner: true } });
  return res.json(projects);
}

export async function createProject(req: Request, res: Response) {
  const { title, description, requiredSkill } = req.body as { title: string; description?: string; requiredSkill: string };
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const ownerId = req.user.id;
  const created = await prisma.project.create({ data: { ownerId, title, description, requiredSkill, status: 'open' } });
  return res.status(201).json(created);
}

export async function updateProject(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { title, description, requiredSkill, status } = req.body as { title?: string; description?: string; requiredSkill?: string; status?: string };
  const updated = await prisma.project.update({ where: { id }, data: { title, description, requiredSkill, status } });
  return res.json(updated);
}

export async function deleteProject(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.project.delete({ where: { id } });
  return res.status(204).send();
}
