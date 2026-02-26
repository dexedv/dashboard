import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { createUserSchema, updateUserSchema } from '@dashboard/shared/zod';
import { adminMiddleware, authMiddleware } from '../middleware/auth.js';

interface UserParams {
  id: string;
}

interface PermissionBody {
  permissions: string[];
}

// Create a new Prisma client for permission queries
const permissionPrisma = new PrismaClient();

export async function userRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // List all users (admin only)
  fastify.get('/', { preHandler: [adminMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: users.map(u => ({
        ...u,
        birthday: u.birthday?.toISOString() || null,
      }))
    };
  });

  // Create user (admin only)
  fastify.post('/', { preHandler: [adminMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createUserSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        error: 'Email already exists',
      });
    }

    // Get the next employee number
    const lastUser = await prisma.user.findFirst({
      orderBy: { employeeNumber: 'desc' },
      select: { employeeNumber: true },
    });
    const nextEmployeeNumber = lastUser ? lastUser.employeeNumber + 1 : 1;

    const passwordHash = await argon2.hash(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role,
        phone: body.phone,
        birthday: body.birthday ? new Date(body.birthday) : null,
        employeeNumber: nextEmployeeNumber,
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

  // Get user by ID (admin only)
  fastify.get('/:id', { preHandler: [adminMiddleware] }, async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
      return reply.status(404).send({
        success: false,
        error: 'User not found'
      });
    }

    return {
      success: true,
      data: {
        ...user,
        birthday: user.birthday?.toISOString() || null,
      }
    };
  });

  // Update user (admin only)
  fastify.patch('/:id', { preHandler: [adminMiddleware] }, async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateUserSchema.parse(request.body);

    // Cannot deactivate yourself
    if (body.active !== undefined && body.active === false && id === request.user.userId) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot deactivate your own account',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user };
  });

  // Delete user (deactivate - admin only)
  fastify.delete('/:id', { preHandler: [adminMiddleware] }, async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    // Cannot delete yourself
    if (id === request.user.userId) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    await prisma.user.update({
      where: { id },
      data: { active: false },
    });

    return { success: true, data: {} };
  });

  // Get all permissions (admin only)
  fastify.get('/permissions', { preHandler: [adminMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const permissions = await permissionPrisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return {
      success: true,
      data: {
        all: permissions,
        grouped,
      },
    };
  });

  // Get user permissions (admin only)
  fastify.get('/:id/permissions', { preHandler: [adminMiddleware] }, async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const userPermissions = await permissionPrisma.userPermission.findMany({
      where: { userId: id },
      include: { permission: true },
    });

    return {
      success: true,
      data: userPermissions.map(up => up.permission),
    };
  });

  // Set user permissions (admin only)
  fastify.post('/:id/permissions', { preHandler: [adminMiddleware] }, async (request: FastifyRequest<{ Params: UserParams; Body: PermissionBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { permissions } = request.body;

    if (!permissions || !Array.isArray(permissions)) {
      return reply.status(400).send({
        success: false,
        error: 'Permissions array is required',
      });
    }

    // Delete all existing permissions for this user
    await permissionPrisma.userPermission.deleteMany({
      where: { userId: id },
    });

    // Get permission IDs for the provided permission names
    const permissionRecords = await permissionPrisma.permission.findMany({
      where: { name: { in: permissions } },
    });

    // Create new user permissions
    if (permissionRecords.length > 0) {
      await permissionPrisma.userPermission.createMany({
        data: permissionRecords.map(p => ({
          userId: id,
          permissionId: p.id,
        })),
      });
    }

    // Return the updated permissions
    const userPermissions = await permissionPrisma.userPermission.findMany({
      where: { userId: id },
      include: { permission: true },
    });

    return {
      success: true,
      data: userPermissions.map(up => up.permission),
    };
  });

  // Get current user's permissions
  fastify.get('/me/permissions', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId as string;

    const userPermissions = await permissionPrisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    return {
      success: true,
      data: userPermissions.map(up => up.permission),
    };
  });

  // Get all users with email for CC in emails (any authenticated user)
  fastify.get('/with-email', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: users,
    };
  });
}
