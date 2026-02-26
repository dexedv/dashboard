import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createNoteSchema, updateNoteSchema, noteSearchSchema } from '@dashboard/shared/zod';
import { authMiddleware } from '../middleware/auth.js';

interface NoteParams {
  id: string;
}

export async function noteRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // List notes with search/filter
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { q, tag, pinned } = noteSearchSchema.parse(request.query);

    const where: any = { userId: request.user.userId };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ];
    }

    if (tag) {
      where.tags = { contains: `"${tag}"` };
    }

    if (pinned !== undefined) {
      where.pinned = pinned;
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Parse tags JSON
    const parsedNotes = notes.map(note => ({
      ...note,
      tags: JSON.parse(note.tags || '[]'),
    }));

    return { success: true, data: parsedNotes };
  });

  // Create note
  fastify.post('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createNoteSchema.parse(request.body);

    const note = await prisma.note.create({
      data: {
        userId: request.user.userId,
        title: body.title,
        content: body.content,
        tags: JSON.stringify(body.tags),
        pinned: body.pinned,
      },
    });

    return {
      success: true,
      data: {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
      },
    };
  });

  // Get single note
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: NoteParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const note = await prisma.note.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!note) {
      return reply.status(404).send({ success: false, error: 'Note not found' });
    }

    return {
      success: true,
      data: {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
      },
    };
  });

  // Update note
  fastify.put('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: NoteParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateNoteSchema.parse(request.body);

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingNote) {
      return reply.status(404).send({ success: false, error: 'Note not found' });
    }

    const updateData: any = { ...body };
    if (body.tags !== undefined) {
      updateData.tags = JSON.stringify(body.tags);
    }

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
      },
    };
  });

  // Delete note
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: NoteParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingNote) {
      return reply.status(404).send({ success: false, error: 'Note not found' });
    }

    await prisma.note.delete({ where: { id } });

    return { success: true, data: {} };
  });

  // Toggle pin
  fastify.patch('/:id/pin', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: NoteParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingNote) {
      return reply.status(404).send({ success: false, error: 'Note not found' });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { pinned: !existingNote.pinned },
    });

    return {
      success: true,
      data: {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
      },
    };
  });
}
