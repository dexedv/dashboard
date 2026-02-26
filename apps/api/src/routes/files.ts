import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middleware/auth.js';

interface FileParams {
  id: string;
}

export async function fileRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;
  const uploadDir = fastify.config.uploadDir;

  // List files
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { customerId, orderId } = request.query as { customerId?: string; orderId?: string };

    const where: any = { ownerUserId: request.user.userId };

    if (customerId) {
      // Verify customer belongs to user
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId: request.user.userId },
      });
      if (!customer) {
        return reply.status(404).send({ success: false, error: 'Customer not found' });
      }
      where.customerId = customerId;
    }

    if (orderId) {
      // Verify order belongs to user
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customer: { userId: request.user.userId },
        },
      });
      if (!order) {
        return reply.status(404).send({ success: false, error: 'Order not found' });
      }
      where.orderId = orderId;
    }

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: files.map(f => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  });

  // Upload file
  fastify.post('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ success: false, error: 'No file uploaded' });
    }

    const { customerId, orderId } = request.body as { customerId?: string; orderId?: string };

    // Verify customer belongs to user if provided
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId: request.user.userId },
      });
      if (!customer) {
        return reply.status(404).send({ success: false, error: 'Customer not found' });
      }
    }

    // Verify order belongs to user if provided
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customer: { userId: request.user.userId },
        },
      });
      if (!order) {
        return reply.status(404).send({ success: false, error: 'Order not found' });
      }
    }

    // Generate unique filename
    const ext = path.extname(data.filename);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    await fs.promises.writeFile(filepath, await data.toBuffer());

    const file = await prisma.file.create({
      data: {
        ownerUserId: request.user.userId,
        customerId: customerId || null,
        orderId: orderId || null,
        filename,
        originalName: data.filename,
        mimeType: data.mimetype || 'application/octet-stream',
        size: (await fs.promises.stat(filepath)).size,
        path: filepath,
      },
    });

    return {
      success: true,
      data: {
        ...file,
        createdAt: file.createdAt.toISOString(),
      },
    };
  });

  // Download file
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const file = await prisma.file.findFirst({
      where: { id, ownerUserId: request.user.userId },
    });

    if (!file) {
      return reply.status(404).send({ success: false, error: 'File not found' });
    }

    // Check if file exists
    if (!fs.existsSync(file.path)) {
      return reply.status(404).send({ success: false, error: 'File not found on disk' });
    }

    const fileStream = fs.createReadStream(file.path);

    reply.header('Content-Disposition', `attachment; filename="${file.originalName}"`);
    reply.header('Content-Type', file.mimeType);

    return reply.send(fileStream);
  });

  // Delete file
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const file = await prisma.file.findFirst({
      where: { id, ownerUserId: request.user.userId },
    });

    if (!file) {
      return reply.status(404).send({ success: false, error: 'File not found' });
    }

    // Delete from disk
    if (fs.existsSync(file.path)) {
      await fs.promises.unlink(file.path);
    }

    // Delete from DB
    await prisma.file.delete({ where: { id } });

    return { success: true, data: {} };
  });
}
