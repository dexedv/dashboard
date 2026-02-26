import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCustomerSchema, updateCustomerSchema } from '@dashboard/shared/zod';
import { authMiddleware } from '../middleware/auth.js';

interface CustomerParams {
  id: string;
}

export async function customerRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // List customers
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { q } = request.query as { q?: string };

    const where: any = { userId: request.user.userId };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const parsedCustomers = customers.map(c => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      ordersCount: c._count.orders,
    }));

    return { success: true, data: parsedCustomers };
  });

  // Create customer
  fastify.post('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createCustomerSchema.parse(request.body);

    const customer = await prisma.customer.create({
      data: {
        userId: request.user.userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        notes: body.notes,
      },
    });

    return {
      success: true,
      data: {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        ordersCount: 0,
      },
    };
  });

  // Get single customer with orders
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: CustomerParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const customer = await prisma.customer.findFirst({
      where: { id, userId: request.user.userId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return reply.status(404).send({ success: false, error: 'Customer not found' });
    }

    return {
      success: true,
      data: {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        orders: customer.orders.map(o => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        })),
      },
    };
  });

  // Update customer
  fastify.put('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: CustomerParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateCustomerSchema.parse(request.body);

    const existingCustomer = await prisma.customer.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingCustomer) {
      return reply.status(404).send({ success: false, error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: body,
    });

    return {
      success: true,
      data: {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
    };
  });

  // Delete customer
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: CustomerParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const existingCustomer = await prisma.customer.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingCustomer) {
      return reply.status(404).send({ success: false, error: 'Customer not found' });
    }

    await prisma.customer.delete({ where: { id } });

    return { success: true, data: {} };
  });
}
