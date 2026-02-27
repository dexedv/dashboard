import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple encryption for license codes
function encrypt(text: string): string {
  const base64 = Buffer.from(text).toString('base64');
  return base64;
}

function decrypt(text: string): string {
  return Buffer.from(text, 'base64').toString('utf-8');
}

interface LicenseData {
  customerId: string;
  customerName: string;
  expiresAt: string;
  maxUsers: number;
  features: string[];
}

export default async function licenseRoutes(server: FastifyInstance) {
  // Validate license
  server.get('/validate', async (request) => {
    const licenseKey = request.query['key'] as string;

    if (!licenseKey) {
      return { valid: false, error: 'Kein Lizenzschlüssel angegeben' };
    }

    try {
      const decoded = decrypt(licenseKey);
      const data: LicenseData = JSON.parse(decoded);

      // Check if expired
      const expires = new Date(data.expiresAt);
      if (expires < new Date()) {
        return { valid: false, error: 'Lizenz abgelaufen' };
      }

      // Check license in database
      const license = await prisma.license.findFirst({
        where: {
          key: licenseKey,
          active: true,
        },
      });

      if (!license) {
        // Create new license record
        await prisma.license.create({
          data: {
            key: licenseKey,
            customerId: data.customerId,
            customerName: data.customerName,
            expiresAt: new Date(data.expiresAt),
            maxUsers: data.maxUsers,
            features: JSON.stringify(data.features),
            active: true,
          },
        });
      }

      return {
        valid: true,
        data: {
          customerId: data.customerId,
          customerName: data.customerName,
          expiresAt: data.expiresAt,
          maxUsers: data.maxUsers,
          features: data.features,
        },
      };
    } catch (error) {
      return { valid: false, error: 'Ungültiger Lizenzschlüssel' };
    }
  });

  // Get license status (for admin)
  server.get('/status', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;

    if (user.role !== 'ADMIN') {
      throw new Error('Nur Administratoren können diese Funktion nutzen');
    }

    const license = await prisma.license.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      return { active: false };
    }

    // Count current users
    const userCount = await prisma.user.count();

    return {
      active: true,
      customerId: license.customerId,
      customerName: license.customerName,
      expiresAt: license.expiresAt,
      maxUsers: license.maxUsers,
      currentUsers: userCount,
      features: JSON.parse(license.features || '[]'),
    };
  });

  // Generate license (for admin - would normally be on license server)
  server.post('/generate', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;

    if (user.role !== 'ADMIN') {
      throw new Error('Nur Administratoren können diese Funktion nutzen');
    }

    const { customerId, customerName, expiresAt, maxUsers, features } = request.body as {
      customerId: string;
      customerName: string;
      expiresAt: string;
      maxUsers: number;
      features: string[];
    };

    const data: LicenseData = {
      customerId,
      customerName,
      expiresAt,
      maxUsers,
      features,
    };

    const licenseKey = encrypt(JSON.stringify(data));

    return {
      success: true,
      licenseKey,
      data,
    };
  });
}
