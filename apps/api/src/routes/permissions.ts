import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function permissionRoutes(server: FastifyInstance) {
  // Get all permissions (grouped by category)
  server.get('/', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;

    // Check if user has admin access
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true },
    });

    const hasAdminAccess = userPermissions.some(
      (up) => up.permission.name === 'admin.access_panel'
    );

    if (!hasAdminAccess) {
      throw new Error('Kein Zugriff auf Berechtigungsverwaltung');
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return { success: true, data: grouped };
  });

  // Get permissions for a specific user
  server.get('/user/:userId', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;
    const { userId } = request.params as { userId: string };

    // Check if user has admin access
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true },
    });

    const hasAdminAccess = userPermissions.some(
      (up) => up.permission.name === 'admin.manage_permissions'
    );

    if (!hasAdminAccess) {
      throw new Error('Kein Zugriff auf Berechtigungsverwaltung');
    }

    const targetUserPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const permissionIds = targetUserPermissions.map((up) => up.permissionId);

    return { success: true, data: permissionIds };
  });

  // Set permissions for a user
  server.post('/user/:userId', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;
    const { userId } = request.params as { userId: string };
    const { permissionIds } = request.body as { permissionIds: string[] };

    // Check if user has admin access
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true },
    });

    const hasAdminAccess = userPermissions.some(
      (up) => up.permission.name === 'admin.manage_permissions'
    );

    if (!hasAdminAccess) {
      throw new Error('Kein Zugriff auf Berechtigungsverwaltung');
    }

    // Remove all existing permissions
    await prisma.userPermission.deleteMany({
      where: { userId },
    });

    // Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      await prisma.userPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          userId,
          permissionId,
        })),
      });
    }

    return { success: true, message: 'Berechtigungen aktualisiert' };
  });
}
