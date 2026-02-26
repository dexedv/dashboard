import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dashboard.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminName = process.env.ADMIN_NAME || 'Administrator';

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: 'ADMIN',
        active: true,
      },
    });

    console.log(`Created admin user: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
  }

  // Create a demo user
  const demoEmail = 'user@dashboard.local';
  const demoPassword = 'user123456';

  const existingDemo = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existingDemo) {
    const passwordHash = await argon2.hash(demoPassword);

    const demo = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        name: 'Demo User',
        role: 'USER',
        active: true,
      },
    });

    console.log(`Created demo user: ${demo.email} (password: ${demoPassword})`);
  } else {
    console.log(`Demo user already exists: ${existingDemo.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
