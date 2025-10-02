import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const [owner, worker, broker] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'owner@example.com' },
      update: {},
      create: { email: 'owner@example.com', password, fullName: 'Olivia Owner', role: 'OWNER' },
    }),
    prisma.user.upsert({
      where: { email: 'worker@example.com' },
      update: {},
      create: { email: 'worker@example.com', password, fullName: 'Walter Worker', role: 'WORKER' },
    }),
    prisma.user.upsert({
      where: { email: 'broker@example.com' },
      update: {},
      create: { email: 'broker@example.com', password, fullName: 'Benny Broker', role: 'BROKER' },
    }),
  ]);

  const job = await prisma.job.upsert({
    where: { id: 'seed-job' },
    update: {},
    create: {
      id: 'seed-job',
      title: 'Install electrical wiring',
      description: 'Need certified electrician for 3BHK project',
      location: 'Chennai',
      category: 'electrician',
      budget: 50000,
      ownerId: owner.id,
    },
  });

  await prisma.brokerage.upsert({
    where: { jobId: job.id },
    update: {},
    create: { jobId: job.id, brokerId: broker.id, feePct: 12 },
  });

  console.log('Seeded:', { owner: owner.email, worker: worker.email, broker: broker.email, job: job.title });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
