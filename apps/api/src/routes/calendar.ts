import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCalendarEventSchema, updateCalendarEventSchema } from '@dashboard/shared/zod';
import { authMiddleware } from '../middleware/auth.js';

interface CalendarParams {
  id: string;
}

export async function calendarRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // List events with optional date range
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { start, end } = request.query as { start?: string; end?: string };

    // Admin sees all events, regular users see only their own
    const isAdmin = request.user.role === 'ADMIN';
    const where: any = isAdmin ? {} : { userId: request.user.userId };

    if (start && end) {
      where.startAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });

    return { success: true, data: events };
  });

  // Create event
  fastify.post('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createCalendarEventSchema.parse(request.body);

    const event = await prisma.calendarEvent.create({
      data: {
        userId: request.user.userId,
        orderId: body.orderId,
        title: body.title,
        description: body.description,
        location: body.location,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        reminderMinutes: body.reminderMinutes,
      },
    });

    return { success: true, data: event };
  });

  // Get single event
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: CalendarParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    return { success: true, data: event };
  });

  // Update event
  fastify.put('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: CalendarParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateCalendarEventSchema.parse(request.body);

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingEvent) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    const updateData: any = { ...body };
    if (body.startAt) updateData.startAt = new Date(body.startAt);
    if (body.endAt) updateData.endAt = new Date(body.endAt);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: event };
  });

  // Delete event
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: CalendarParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingEvent) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return { success: true, data: {} };
  });
}
