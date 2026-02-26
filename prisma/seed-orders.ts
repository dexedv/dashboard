import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const orderTitles = [
  'Website-Relaunch', 'Logo-Neugestaltung', 'Wartung & Support',
  'Installation Server', 'Business-Beratung', 'Mitarbeiter-Schulung',
  'IT-Support Vertrag', 'Sicherheits-Audit', 'System-Optimierung',
  'Software-Update', 'Datenbank-Migration', 'Cloud-Einrichtung',
  'Netzwerk-Setup', 'App-Entwicklung', 'E-Mail-Marketing',
  'SEO-Optimierung', 'Grafikdesign', 'Content-Erstellung',
  'Server-Wartung', 'Backup-Einrichtung'
];

const orderStatuses = ['NEW', 'IN_PROGRESS', 'WAITING_MATERIAL', 'DONE'];

async function main() {
  console.log('Creating orders for employees...');

  // Get all users
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { employeeNumber: 'asc' },
  });

  // Get customers for each user, or create one if none exists
  for (const user of users) {
    let customer = await prisma.customer.findFirst({
      where: { userId: user.id },
    });

    // If no customer exists for this user, create one
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          name: `${user.name}'s Kunde`,
          email: user.email,
        },
      });
    }

    // Create order for this employee
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-14 days

    const promisedDeliveryDate = new Date(dueDate);
    promisedDeliveryDate.setDate(promisedDeliveryDate.getDate() + 7); // 7 days after due

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        userId: user.id,
        title: orderTitles[user.employeeNumber % orderTitles.length],
        description: `Auftrag erstellt von ${user.name} - Lieferung innerhalb 2 Wochen`,
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        dueDate,
        promisedDeliveryDate,
      },
    });

    // Create initial order event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'STATUS_CHANGE',
        note: `Order erstellt von ${user.name} mit Status: ${order.status}`,
      },
    });

    console.log(`Created order for ${user.name} (#${user.employeeNumber}): "${order.title}" - Due: ${dueDate.toISOString().split('T')[0]}`);
  }

  console.log('\nDone! All employees now have orders with dates in the next 2 weeks.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
