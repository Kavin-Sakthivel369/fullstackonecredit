import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const name = process.env.ADMIN_NAME || 'Admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const hashed = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({ data: { email, name, password: hashed, role: 'ADMIN', approved: true } });
    // eslint-disable-next-line no-console
    console.log('Seeded admin user:', email);
  } else {
    // eslint-disable-next-line no-console
    console.log('Admin already exists:', email);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
