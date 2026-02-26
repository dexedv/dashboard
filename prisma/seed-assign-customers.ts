import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const companies = [
  'TechCorp GmbH', 'Innovation OHG', 'Digital Solutions', 'Handelsagentur', 'Produktions GmbH',
  'Service Center', 'Bau GmbH', 'Logistik KG', 'Marketing Agentur', 'Beratungs GmbH',
  'IT Services', 'Finanzberatung', 'Architekturbüro', 'Immobilien GmbH', 'Versicherungsmakler',
  'Autohaus', 'Restaurant GmbH', 'Hotel KG', 'Fitness Studio', 'Bildungsinstitut',
  'Softwareentwicklung', 'Elektronik GmbH', 'Maschinenbau', 'Chemie GmbH', 'Energieberatung',
  'Rechtsanwaltskanzlei', 'Steuerberater', 'Werbung GmbH', 'Eventagentur', 'Reisebüro'
];

async function main() {
  console.log('Assigning orders to customers...');

  // Get all active users (employees)
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { employeeNumber: 'asc' },
  });

  // Get all customers (belonging to admin)
  const customers = await prisma.customer.findMany({
    where: { userId: users[0].id }, // Admin's customers
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${users.length} users and ${customers.length} customers`);

  // For each user, create or get a customer and assign order
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    // Get or create customer for this user
    let customer = customers[i % customers.length];

    // If this user doesn't have their own customer yet, create one
    let existingCustomer = await prisma.customer.findFirst({
      where: { userId: user.id },
    });

    if (!existingCustomer) {
      existingCustomer = await prisma.customer.create({
        data: {
          userId: user.id,
          name: companies[i % companies.length],
          email: user.email,
          phone: user.phone || undefined,
        },
      });
      console.log(`Created customer "${existingCustomer.name}" for ${user.name}`);
      customer = existingCustomer;
    }

    // Update or create order for this user with the correct customer
    const existingOrder = await prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOrder) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: { customerId: customer.id },
      });
      console.log(`Updated order for ${user.name} -> customer: ${customer.name}`);
    }
  }

  console.log('\nDone! Orders are now assigned to different customers.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
