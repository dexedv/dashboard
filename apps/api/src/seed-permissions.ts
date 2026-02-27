import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // Orders
  { name: 'orders.view', description: 'Aufträge anzeigen', category: 'orders' },
  { name: 'orders.view_single', description: 'Einzelne Aufträge anzeigen', category: 'orders' },
  { name: 'orders.create', description: 'Aufträge erstellen', category: 'orders' },
  { name: 'orders.edit', description: 'Aufträge bearbeiten', category: 'orders' },
  { name: 'orders.delete', description: 'Aufträge löschen', category: 'orders' },
  { name: 'orders.change_status', description: 'Auftragsstatus ändern', category: 'orders' },
  { name: 'orders.add_event', description: 'Auftragsereignisse hinzufügen', category: 'orders' },

  // Customers
  { name: 'customers.view', description: 'Kunden anzeigen', category: 'customers' },
  { name: 'customers.view_details', description: 'Kundendetails anzeigen', category: 'customers' },
  { name: 'customers.create', description: 'Kunden erstellen', category: 'customers' },
  { name: 'customers.edit', description: 'Kunden bearbeiten', category: 'customers' },
  { name: 'customers.delete', description: 'Kunden löschen', category: 'customers' },
  { name: 'customers.upload_files', description: 'Dateien zu Kunden hochladen', category: 'customers' },
  { name: 'customers.delete_files', description: 'Dateien von Kunden löschen', category: 'customers' },

  // Employees
  { name: 'employees.view', description: 'Mitarbeiter anzeigen', category: 'employees' },
  { name: 'employees.view_details', description: 'Mitarbeiterdetails anzeigen', category: 'employees' },
  { name: 'employees.create', description: 'Mitarbeiter erstellen', category: 'employees' },
  { name: 'employees.edit', description: 'Mitarbeiter bearbeiten', category: 'employees' },
  { name: 'employees.delete', description: 'Mitarbeiter löschen', category: 'employees' },
  { name: 'employees.change_role', description: 'Rolle ändern', category: 'employees' },
  { name: 'employees.toggle_active', description: 'Mitarbeiter aktivieren/deaktivieren', category: 'employees' },

  // Calendar
  { name: 'calendar.view', description: 'Kalender anzeigen', category: 'calendar' },
  { name: 'calendar.view_single', description: 'Einzelne Termine anzeigen', category: 'calendar' },
  { name: 'calendar.create', description: 'Termine erstellen', category: 'calendar' },
  { name: 'calendar.edit', description: 'Termine bearbeiten', category: 'calendar' },
  { name: 'calendar.delete', description: 'Termine löschen', category: 'calendar' },

  // Notes
  { name: 'notes.view', description: 'Notizen anzeigen', category: 'notes' },
  { name: 'notes.create', description: 'Notizen erstellen', category: 'notes' },
  { name: 'notes.edit', description: 'Notizen bearbeiten', category: 'notes' },
  { name: 'notes.delete', description: 'Notizen löschen', category: 'notes' },
  { name: 'notes.pin', description: 'Notizen anheften', category: 'notes' },

  // Files
  { name: 'files.view', description: 'Dateien anzeigen', category: 'files' },
  { name: 'files.upload', description: 'Dateien hochladen', category: 'files' },
  { name: 'files.download', description: 'Dateien herunterladen', category: 'files' },
  { name: 'files.delete', description: 'Dateien löschen', category: 'files' },

  // Home
  { name: 'home.view', description: 'Startseite anzeigen', category: 'home' },
  { name: 'home.create_todo', description: 'Todos erstellen', category: 'home' },
  { name: 'home.edit_todo', description: 'Todos bearbeiten', category: 'home' },
  { name: 'home.delete_todo', description: 'Todos löschen', category: 'home' },

  // Spotify
  { name: 'spotify.view', description: 'Spotify anzeigen', category: 'spotify' },
  { name: 'spotify.connect', description: 'Spotify verbinden', category: 'spotify' },
  { name: 'spotify.disconnect', description: 'Spotify trennen', category: 'spotify' },
  { name: 'spotify.search', description: 'Spotify-Suche', category: 'spotify' },
  { name: 'spotify.view_playlists', description: 'Playlists anzeigen', category: 'spotify' },

  // Admin
  { name: 'admin.access_panel', description: 'Admin-Panel zugreifen', category: 'admin' },
  { name: 'admin.manage_users', description: 'Benutzer verwalten', category: 'admin' },
  { name: 'admin.manage_permissions', description: 'Berechtigungen verwalten', category: 'admin' },
];

async function main() {
  console.log('Seeding permissions...');

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.log(`Seeded ${permissions.length} permissions`);

  // Give admin user all permissions
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (admin) {
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: admin.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          userId: admin.id,
          permissionId: perm.id,
        },
      });
    }
    console.log(`Added all permissions to admin user (${admin.email})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
