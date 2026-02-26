import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Linking calendar events to orders...');

  // Get all calendar events with "[Lieferung]" in title
  const events = await prisma.calendarEvent.findMany({
    where: {
      title: { contains: '[Lieferung]' },
    },
  });

  console.log(`Found ${events.length} delivery events`);

  for (const event of events) {
    // Extract order title from event title
    const orderTitle = event.title.replace('[Lieferung] ', '');

    // Find the matching order
    const order = await prisma.order.findFirst({
      where: {
        userId: event.userId,
        title: orderTitle,
      },
    });

    if (order) {
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { orderId: order.id },
      });
      console.log(`Linked event "${event.title}" to order "${order.title}"`);
    } else {
      console.log(`No matching order found for: ${event.title}`);
    }
  }

  console.log('\nDone! Calendar events are now linked to orders.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
