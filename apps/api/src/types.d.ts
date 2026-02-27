import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    config: {
      jwtAccessSecret: string;
      jwtRefreshSecret: string;
      uploadDir: string;
      spotify: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
      };
    };
  }

  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
