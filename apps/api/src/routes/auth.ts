import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { loginSchema, createUserSchema } from '@dashboard/shared/zod';
import { authMiddleware } from '../middleware/auth.js';

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.active) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const validPassword = await argon2.verify(user.passwordHash, body.password);
    if (!validPassword) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, { expiresIn: '15m' });

    const refreshToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    };
  });

  // Refresh token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'Refresh token required',
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    // Rotate token
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    const newRefreshToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: newRefreshToken,
        expiresAt,
      },
    });

    const accessToken = fastify.jwt.sign({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    }, { expiresIn: '15m' });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  });

  // Logout
  fastify.post('/logout', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Also delete all refresh tokens for this user (logout all devices)
    await prisma.refreshToken.deleteMany({
      where: { userId: request.user.userId },
    });

    return { success: true, data: {} };
  });

  // Register - only allows creating first admin user if no users exist
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createUserSchema.parse(request.body);

    // Check if users already exist
    const userCount = await prisma.user.count();

    // If users already exist, registration is disabled
    if (userCount > 0) {
      return reply.status(403).send({
        success: false,
        error: 'Registrierung deaktiviert. Bitte kontaktieren Sie den Administrator.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'Email bereits vergeben' });
    }

    // First user becomes ADMIN
    const role = 'ADMIN';

    // Get next employee number
    const lastUser = await prisma.user.findFirst({
      orderBy: { employeeNumber: 'desc' },
      select: { employeeNumber: true },
    });
    const nextEmployeeNumber = lastUser ? lastUser.employeeNumber + 1 : 1;

    const passwordHash = await argon2.hash(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role,
        employeeNumber: nextEmployeeNumber,
      },
    });

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, { expiresIn: '15m' });

    const refreshToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      }
    };
  });

  // Get current user
  fastify.get('/me', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        phone: true,
        birthday: true,
        employeeNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    return {
      success: true,
      data: {
        ...user,
        birthday: user.birthday?.toISOString() || null,
      }
    };
  });

  // Update current user
  fastify.put('/me', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { name?: string; email?: string; phone?: string; birthday?: string };

    const user = await prisma.user.update({
      where: { id: request.user.userId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        birthday: body.birthday ? new Date(body.birthday) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        phone: true,
        birthday: true,
        employeeNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: {
        ...user,
        birthday: user.birthday?.toISOString() || null,
      }
    };
  });
}
