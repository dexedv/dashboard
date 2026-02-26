import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating calendar events for existing orders...');

  // Get all orders with delivery dates
  const orders = await prisma.order.findMany({
    where: {
      promisedDeliveryDate: { not: null },
    },
    include: {
      customer: true,
      user: true,
    },
  });

  console.log(`Found ${orders.length} orders with delivery dates`);

  for (const order of orders) {
    if (!order.promisedDeliveryDate) continue;

    // Check if calendar event already exists
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        userId: order.userId,
        title: { contains: order.title },
      },
    });

    if (existingEvent) {
      console.log(`Event already exists for: ${order.title}`);
      continue;
    }

    // Create calendar event
    const deliveryDate = new Date(order.promisedDeliveryDate);
    const startTime = new Date(deliveryDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(deliveryDate);
    endTime.setHours(17, 0, 0, 0);

    const event = await prisma.calendarEvent.create({
      data: {
        userId: order.userId,
        title: `[Lieferung] ${order.title}`,
        description: `Kunde: ${order.customer.name}`,
        startAt: startTime,
        endAt: endTime,
        reminderMinutes: 60,
      },
    });

    console.log(`Created calendar event for: ${order.title} (${order.customer.name})`);
  }

  console.log('\nDone! All orders now have calendar events.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
