import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file first (for local development)
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

// Check for database config file (set by desktop app)
const appDataDir = path.join(os.homedir(), 'DashboardSuite');
const configPath = path.join(appDataDir, 'db-config.json');

let dbUrl = process.env.DATABASE_URL;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.databaseUrl) {
      dbUrl = config.databaseUrl;
      console.log('Using database from config file:', config.type);
    }
  } catch (e) {
    console.error('Error reading config file:', e);
  }
} else {
  console.log('No config file found, using default DATABASE_URL');
}

process.env.DATABASE_URL = dbUrl;

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
import permissionRoutes from './routes/permissions.js';
import whatsappRoutes from './routes/whatsapp.js';
import licenseRoutes from './routes/license.js';
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
      database: dbStatus
    },
    version: '1.0.2'
  };
});

// Database config endpoint (save to file for desktop app)
server.post('/api/system/db-config', async (request) => {
  const { type, host, port, database, username, password } = request.body as {
    type: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
  };

  let databaseUrl = '';

  if (type === 'sqlite') {
    databaseUrl = 'file:./data/dashboard.db';
  } else if (type === 'mysql') {
    databaseUrl = `mysql://${username}:${password}@${host}:${port || 3306}/${database}`;
  } else if (type === 'postgresql') {
    databaseUrl = `postgresql://${username}:${password}@${host}:${port || 5432}/${database}`;
  }

  // Save config to file
  const appDataDir = path.join(os.homedir(), 'DashboardSuite');
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }

  const config = {
    type,
    databaseUrl,
    host,
    port,
    database,
    username,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(appDataDir, 'db-config.json'), JSON.stringify(config, null, 2));

  return { success: true, message: 'Database configuration saved' };
});

// Get current database config
server.get('/api/system/db-config', async () => {
  const configPath = path.join(os.homedir(), 'DashboardSuite', 'db-config.json');

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    // Don't return the full URL, just the type
    return { type: config.type };
  }

  return { type: 'default' };
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
    version: '1.0.2'
  };
});

// Register routes with /api prefix
await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(userRoutes, { prefix: '/api/users' });
await server.register(noteRoutes, { prefix: '/api/notes' });
await server.register(calendarRoutes, { prefix: '/api/calendar' });
await server.register(customerRoutes, { prefix: '/api/customers' });
await server.register(orderRoutes, { prefix: '/api/orders' });
await server.register(fileRoutes, { prefix: '/api/files' });
await server.register(spotifyRoutes, { prefix: '/api/spotify' });
await server.register(emailRoutes, { prefix: '/api/email' });
await server.register(permissionRoutes, { prefix: '/api/permissions' });
await server.register(whatsappRoutes, { prefix: '/api/whatsapp' });
await server.register(licenseRoutes, { prefix: '/api/license' });

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
