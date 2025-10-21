import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      approved: true,
    },
    update: {},
  });
  console.log('Seeded admin:', admin.email);
}

main().finally(async () => {
  await prisma.$disconnect();
});
