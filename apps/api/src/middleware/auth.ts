import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
};

export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Forbidden - Admin only' });
    }
  } catch (err) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
};

// Factory function to create permission check middleware
export const checkPermission = (permissionName: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const prisma = new PrismaClient();
      const userId = request.user.userId as string;

      // Check if user has the required permission
      const userPermission = await prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: userId,
            permissionId: '', // Will be looked up by name
          },
        },
        include: {
          permission: true,
        },
      });

      // Alternative: check by permission name directly
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        return reply.status(500).send({ success: false, error: 'Permission not found' });
      }

      const hasPermission = await prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: userId,
            permissionId: permission.id,
          },
        },
      });

      if (!hasPermission) {
        return reply.status(403).send({ success: false, error: `Forbidden - ${permissionName} required` });
      }

      await prisma.$disconnect();
    } catch (err) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
  };
};
