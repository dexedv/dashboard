import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import fs from 'fs';

import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { noteRoutes } from './routes/notes.js';
import { calendarRoutes } from './routes/calendar.js';
import { customerRoutes } from './routes/customers.js';
import { orderRoutes } from './routes/orders.js';
import { fileRoutes } from './routes/files.js';
import { spotifyRoutes } from './routes/spotify.js';
import { emailRoutes } from './routes/email.js';
import { authMiddleware } from './middleware/auth.js';

const prisma = new PrismaClient();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Create upload directory
const uploadDir = process.env.UPLOAD_DIR || './data/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Register plugins
await server.register(cors, {
  origin: true,
  credentials: true,
});

await server.register(jwt, {
  secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-minimum-32-characters-long',
});

await server.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  },
});

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: ['/health'],
});

// Decorate with prisma and config
server.decorate('prisma', prisma);
server.decorate('config', {
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  uploadDir,
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5173/spotify/callback',
  },
});

// Add auth decorator
server.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
});

// Add admin check decorator
server.decorate('requireAdmin', async function (request: any, reply: any) {
  if (request.user.role !== 'ADMIN') {
    reply.status(403).send({ success: false, error: 'Forbidden - Admin only' });
  }
});

// Health check
server.get('/health', async () => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'error' // TEST: force error for red indicator
    }
  };
});

// System status endpoint
server.get('/api/system/status', {
  preHandler: [server.authenticate]
}, async () => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  return {
    api: 'ok',
    database: dbStatus,
    version: '1.0.0'
  };
});

// Register routes
await server.register(authRoutes, { prefix: '/auth' });
await server.register(userRoutes, { prefix: '/users' });
await server.register(noteRoutes, { prefix: '/notes' });
await server.register(calendarRoutes, { prefix: '/calendar' });
await server.register(customerRoutes, { prefix: '/customers' });
await server.register(orderRoutes, { prefix: '/orders' });
await server.register(fileRoutes, { prefix: '/files' });
await server.register(spotifyRoutes, { prefix: '/spotify' });
await server.register(emailRoutes, { prefix: '/email' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

export { server, prisma };
