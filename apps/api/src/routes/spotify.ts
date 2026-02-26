import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function spotifyRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;
  const spotifyConfig = fastify.config.spotify;

  // Start OAuth flow
  fastify.get('/auth', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-library-read',
      'streaming',
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: spotifyConfig.clientId,
      scope: scopes.join(' '),
      redirect_uri: spotifyConfig.redirectUri,
      state: request.user.userId,
    });

    const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;

    return { success: true, data: { url: authUrl } };
  });

  // OAuth callback (called from frontend)
  fastify.post('/callback', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.body as { code: string };

    if (!code) {
      return reply.status(400).send({ success: false, error: 'Authorization code required' });
    }

    // Exchange code for tokens
    const credentials = Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64');

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: spotifyConfig.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return reply.status(400).send({ success: false, error: 'Failed to exchange code for tokens', details: error });
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Save or update tokens
    const existingToken = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    if (existingToken) {
      await prisma.spotifyToken.update({
        where: { userId: request.user.userId },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    } else {
      await prisma.spotifyToken.create({
        data: {
          userId: request.user.userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    }

    return { success: true, data: { connected: true } };
  });

  // Get playlists
  fastify.get('/playlists', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const spotifyToken = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    if (!spotifyToken) {
      return reply.status(401).send({ success: false, error: 'Spotify not connected' });
    }

    // Check if token needs refresh
    if (spotifyToken.expiresAt < new Date()) {
      await refreshSpotifyToken(prisma, request.user.userId, spotifyToken.refreshToken, spotifyConfig);
    }

    const token = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    const response = await fetch(`${SPOTIFY_API_URL}/me/playlists?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token!.accessToken}`,
      },
    });

    if (!response.ok) {
      return reply.status(response.status).send({ success: false, error: 'Failed to fetch playlists' });
    }

    const data = await response.json();

    return { success: true, data: data.items };
  });

  // Search
  fastify.get('/search', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { q, type = 'track', limit = 20 } = request.query as { q?: string; type?: string; limit?: string };

    if (!q) {
      return reply.status(400).send({ success: false, error: 'Search query required' });
    }

    const spotifyToken = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    if (!spotifyToken) {
      return reply.status(401).send({ success: false, error: 'Spotify not connected' });
    }

    // Check if token needs refresh
    if (spotifyToken.expiresAt < new Date()) {
      await refreshSpotifyToken(prisma, request.user.userId, spotifyToken.refreshToken, spotifyConfig);
    }

    const token = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    const params = new URLSearchParams({
      q,
      type,
      limit,
    });

    const response = await fetch(`${SPOTIFY_API_URL}/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token!.accessToken}`,
      },
    });

    if (!response.ok) {
      return reply.status(response.status).send({ success: false, error: 'Search failed' });
    }

    const data = await response.json();

    return { success: true, data };
  });

  // Get current user info
  fastify.get('/me', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const spotifyToken = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    if (!spotifyToken) {
      return { success: true, data: { connected: false } };
    }

    // Check if token needs refresh
    if (spotifyToken.expiresAt < new Date()) {
      await refreshSpotifyToken(prisma, request.user.userId, spotifyToken.refreshToken, spotifyConfig);
    }

    const token = await prisma.spotifyToken.findUnique({
      where: { userId: request.user.userId },
    });

    const response = await fetch(`${SPOTIFY_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token!.accessToken}`,
      },
    });

    if (!response.ok) {
      return { success: true, data: { connected: false } };
    }

    const user = await response.json();

    return { success: true, data: { connected: true, user } };
  });

  // Disconnect Spotify
  fastify.delete('/connection', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    await prisma.spotifyToken.deleteMany({
      where: { userId: request.user.userId },
    });

    return { success: true, data: {} };
  });
}

async function refreshSpotifyToken(
  prisma: PrismaClient,
  userId: string,
  refreshToken: string,
  config: { clientId: string; clientSecret: string }
) {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

  await prisma.spotifyToken.update({
    where: { userId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      expiresAt,
    },
  });
}
