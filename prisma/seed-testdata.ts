import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const firstNames = ['Max', 'Anna', 'Lukas', 'Sophie', 'Felix', 'Mia', 'Leon', 'Emma', 'Noah', 'Lena', 'Elias', 'Hannah', 'Tim', 'Laura', 'Jan', 'Sarah', 'Lucas', 'Marie', 'David', 'Lea'];
const lastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Sauer', 'Römer', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger'];

const companyNames = ['TechCorp GmbH', 'Innovation OHG', 'Digital Solutions', 'Handelsagentur', 'Produktions GmbH', 'Service Center', 'Bau GmbH', 'Logistik KG', 'Marketing Agentur', 'Beratungs GmbH',
  'IT Services', 'FinanzberArchitektatung', 'urbüro', 'Immobilien GmbH', 'Versicherungsmakler', 'Autohaus', 'Restaurant GmbH', 'Hotel KG', 'Fitness Studio', 'Bildungsinstitut',
  'Softwareentwicklung', 'Elektronik GmbH', 'Maschinenbau', 'Chemie GmbH', 'Energieberatung', 'Rechtsanwaltskanzlei', 'Steuerberater', 'Werbung GmbH', 'Eventagentur', 'Reisebüro'];

const orderTitles = ['Website Erstellung', 'Logo Design', 'Wartungsauftrag', 'Installation', 'Beratung', 'Schulung', 'Support-Vertrag', 'Audit', 'Optimierung', 'Update'];
const orderStatuses = ['NEW', 'IN_PROGRESS', 'WAITING_MATERIAL', 'DONE'];

async function main() {
  console.log('Starting seed...');

  const passwordHash = await argon2.hash('password123');

  // Get existing admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!existingAdmin) {
    console.log('No admin found, creating one...');
  }

  // Create 20 employees (including admin if exists)
  const employees = [];
  const adminUser = existingAdmin || await prisma.user.create({
    data: {
      email: 'admin@dashboard.local',
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
      employeeNumber: 1,
      phone: '+49 123 456789',
    },
  });
  employees.push(adminUser);

  // Get last employee number
  const lastUser = await prisma.user.findFirst({
    orderBy: { employeeNumber: 'desc' },
    select: { employeeNumber: true },
  });
  let nextEmployeeNumber = (lastUser?.employeeNumber || 0) + 1;

  // Create remaining 19 employees
  for (let i = 0; i < 19; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.de`;

    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        passwordHash,
        role: 'USER',
        employeeNumber: nextEmployeeNumber++,
        phone: `+49 123 ${String(456000 + i).padStart(6, '0')}`,
      },
    });
    employees.push(user);
    console.log(`Created employee: ${user.name} (#${user.employeeNumber})`);
  }

  // Create 30 customers (assigned to admin)
  const customers = [];
  for (let i = 0; i < 30; i++) {
    const companyName = companyNames[i % companyNames.length];
    const customer = await prisma.customer.create({
      data: {
        userId: adminUser.id,
        name: i < companyNames.length ? companyName : `${companyNames[i % companyNames.length]} ${i + 1}`,
        email: `info@${companyNames[i % companyNames.length].toLowerCase().replace(/[^a-z]/g, '')}.de`,
        phone: `+49 30 ${String(12345000 + i).padStart(8, '0')}`,
        address: `Hauptstraße ${i + 1}, ${10000 + i} Berlin`,
      },
    });
    customers.push(customer);
    console.log(`Created customer: ${customer.name}`);
  }

  // Create 1 order per employee (20 orders)
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const customer = customers[i % customers.length];

    // For this employee, create a customer if they don't have one yet
    let employeeCustomer = await prisma.customer.findFirst({
      where: { userId: employee.id }
    });

    if (!employeeCustomer) {
      employeeCustomer = await prisma.customer.create({
        data: {
          userId: employee.id,
          name: `${employee.name}'s Kunden`,
          email: employee.email,
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        customerId: employeeCustomer.id,
        userId: employee.id,
        title: `${orderTitles[i % orderTitles.length]} - ${employee.name.split(' ')[0]}`,
        description: `Auftrag erstellt von ${employee.name}`,
        status: orderStatuses[i % orderStatuses.length],
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // Due in 1-20 weeks
        promisedDeliveryDate: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000), // Delivery in 2-40 weeks
      },
    });

    // Create initial order event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'STATUS_CHANGE',
        note: `Order created with status: ${order.status} by ${employee.name}`,
      },
    });

    console.log(`Created order: ${order.title} for ${employee.name}`);
  }

  console.log(`\nSeed complete!`);
  console.log(`- ${employees.length} employees`);
  console.log(`- ${customers.length} customers`);
  console.log(`- ${employees.length} orders (1 per employee)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
