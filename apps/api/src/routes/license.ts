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
      // Decode the license key
      let decoded;
      try {
        decoded = Buffer.from(licenseKey, 'base64').toString('utf-8');
      } catch {
        return { valid: false, error: 'Ungültiges Lizenzschlüsselformat' };
      }

      const data: LicenseData = JSON.parse(decoded);

      // Check if expired
      const expires = new Date(data.expiresAt);
      if (expires < new Date()) {
        return { valid: false, error: 'Lizenz abgelaufen' };
      }

      // Try to save to database (optional - if DB is not available, still allow)
      try {
        // Check if already exists
        const existing = await prisma.license.findFirst({
          where: { key: licenseKey },
        });

        if (!existing) {
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
      } catch (dbError) {
        // Continue even if database save fails
        console.log('Could not save to database:', dbError);
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

    // Get all licenses
    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Count current users
    const userCount = await prisma.user.count();

    // Get active license
    const activeLicense = licenses.find(l => l.active);

    if (!activeLicense) {
      return { active: false, licenses: [] };
    }

    return {
      active: true,
      currentUsers: userCount,
      activeLicense: {
        customerId: activeLicense.customerId,
        customerName: activeLicense.customerName,
        expiresAt: activeLicense.expiresAt,
        maxUsers: activeLicense.maxUsers,
        features: JSON.parse(activeLicense.features || '[]'),
      },
      licenses: licenses.map(l => ({
        id: l.id,
        key: l.key,
        customerId: l.customerId,
        customerName: l.customerName,
        expiresAt: l.expiresAt,
        maxUsers: l.maxUsers,
        active: l.active,
        createdAt: l.createdAt,
      })),
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

    // Save license to database immediately
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

    return {
      success: true,
      licenseKey,
      data,
    };
  });
}
