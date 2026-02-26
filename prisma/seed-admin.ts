import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('admin123456');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@dashboard.local',
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
      employeeNumber: 1,
    },
  });

  console.log('Admin user created:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
