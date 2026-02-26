import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createOrderSchema, updateOrderSchema, createOrderEventSchema } from '@dashboard/shared/zod';
import { authMiddleware } from '../middleware/auth.js';

interface OrderParams {
  id: string;
}

export async function orderRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // List orders with filters
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, customerId, dueSoon } = request.query as {
      status?: string;
      customerId?: string;
      dueSoon?: string;
    };

    const isAdmin = request.user.role === 'ADMIN';

    // Get user's customer IDs (or all if admin)
    let customerIds: string[] | undefined;
    if (!isAdmin) {
      const customers = await prisma.customer.findMany({
        where: { userId: request.user.userId },
        select: { id: true },
      });
      customerIds = customers.map(c => c.id);
    }

    const where: any = isAdmin ? {} : {
      customerId: { in: customerIds },
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (dueSoon) {
      const days = parseInt(dueSoon);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      where.dueDate = {
        lte: futureDate,
        gte: new Date(),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { name: true },
        },
        user: {
          select: { id: true, name: true, employeeNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedOrders = orders.map(o => ({
      id: o.id,
      customerId: o.customerId,
      customerName: o.customer.name,
      userId: o.userId,
      userName: o.user.name,
      userEmployeeNumber: o.user.employeeNumber,
      title: o.title,
      description: o.description,
      status: o.status,
      dueDate: o.dueDate?.toISOString() || null,
      promisedDeliveryDate: o.promisedDeliveryDate?.toISOString() || null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return { success: true, data: parsedOrders };
  });

  // Create order
  fastify.post('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createOrderSchema.parse(request.body);

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: { id: body.customerId, userId: request.user.userId },
    });

    if (!customer) {
      return reply.status(404).send({ success: false, error: 'Customer not found' });
    }

    const order = await prisma.order.create({
      data: {
        customerId: body.customerId,
        userId: request.user.userId,
        title: body.title,
        description: body.description,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        promisedDeliveryDate: body.promisedDeliveryDate ? new Date(body.promisedDeliveryDate) : null,
      },
      include: {
        customer: {
          select: { name: true },
        },
        user: {
          select: { id: true, name: true, email: true, employeeNumber: true },
        },
      },
    });

    // Create initial order event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'STATUS_CHANGE',
        note: `Order created with status: ${order.status}`,
      },
    });

    return {
      success: true,
      data: {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customer.name,
        userId: order.userId,
        userName: order.user.name,
        userEmployeeNumber: order.user.employeeNumber,
        title: order.title,
        description: order.description,
        status: order.status,
        dueDate: order.dueDate?.toISOString() || null,
        promisedDeliveryDate: order.promisedDeliveryDate?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    };
  });

  // Get single order with events
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const isAdmin = request.user.role === 'ADMIN';

    const order = await prisma.order.findFirst({
      where: isAdmin ? { id } : {
        id,
        customer: { userId: request.user.userId },
      },
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true, employeeNumber: true },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    return {
      success: true,
      data: {
        ...order,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
        },
        userId: order.userId,
        userName: order.user.name,
        userEmployeeNumber: order.user.employeeNumber,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        events: order.events.map(e => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
      },
    };
  });

  // Update order
  fastify.put('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateOrderSchema.parse(request.body);

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        customer: { userId: request.user.userId },
      },
    });

    if (!existingOrder) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    const updateData: any = { ...body };
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.promisedDeliveryDate) updateData.promisedDeliveryDate = new Date(body.promisedDeliveryDate);

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    // Log status change event
    if (body.status && body.status !== existingOrder.status) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'STATUS_CHANGE',
          note: `Status changed from ${existingOrder.status} to ${body.status}`,
        },
      });
    }

    return {
      success: true,
      data: {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customer.name,
        title: order.title,
        description: order.description,
        status: order.status,
        dueDate: order.dueDate?.toISOString() || null,
        promisedDeliveryDate: order.promisedDeliveryDate?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    };
  });

  // Delete order
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply) => {
    const { id } = request.params;

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        customer: { userId: request.user.userId },
      },
    });

    if (!existingOrder) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    await prisma.order.delete({ where: { id } });

    return { success: true, data: {} };
  });

  // Add order event
  fastify.post('/:id/events', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = createOrderEventSchema.parse(request.body);

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        customer: { userId: request.user.userId },
      },
    });

    if (!existingOrder) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    const event = await prisma.orderEvent.create({
      data: {
        orderId: id,
        type: body.type,
        note: body.note,
      },
    });

    return {
      success: true,
      data: {
        ...event,
        createdAt: event.createdAt.toISOString(),
      },
    };
  });
}
