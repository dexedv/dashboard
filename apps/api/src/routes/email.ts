import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Imap from 'imap';
import nodemailer from 'nodemailer';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ARGON2_SECRET || 'dev-argon2-secret';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

interface EmailAccountBody {
  email: string;
  imapHost: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  username: string;
  password: string;
}

interface SendEmailBody {
  to: string;
  subject: string;
  body: string;
  html?: string;
  cc?: string;
  bcc?: string;
}

interface FolderParams {
  folder: string;
}

export async function emailRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // Get email account
  fastify.get('/account', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId as string;

    const account = await prisma.emailAccount.findUnique({
      where: { userId },
      select: {
        id: true,
        email: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: account ? { ...account, hasPassword: true } : null,
    };
  });

  // Setup email account
  fastify.post('/account', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Body: EmailAccountBody }>, reply: FastifyReply) => {
    const userId = request.user.userId as string;
    const { email, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure, username, password } = request.body;

    if (!email || !imapHost || !smtpHost || !username || !password) {
      return reply.status(400).send({ success: false, error: 'All fields are required' });
    }

    // Test IMAP connection
    try {
      const port = imapPort || 993;
      const useSSL = imapSecure !== false;

      const imapConfig = {
        user: username,
        password: password,
        host: imapHost,
        port: port,
        connTimeout: 15000,
        authTimeout: 15000,
      };

      // Use SSL/TLS for port 993
      if (useSSL) {
        (imapConfig as any).tls = true;
        (imapConfig as any).tlsOptions = {
          rejectUnauthorized: false,
        };
      }

      console.log('Testing IMAP connection to:', imapHost, 'port:', port, 'ssl:', useSSL);

      const imap = new Imap(imapConfig);

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox('INBOX', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        imap.once('error', (err) => {
          reject(err);
        });
        imap.connect();
      });

      imap.end();
      console.log('IMAP connection successful');
    } catch (err: any) {
      console.error('IMAP connection error:', err);
      const errorMessage = err.message || 'Unbekannter Fehler';

      // More helpful error messages
      if (errorMessage.includes('ECONNREFUSED')) {
        return reply.status(400).send({
          success: false,
          error: `Verbindung abgelehnt. Bitte überprüfen Sie Host (${imapHost}) und Port.`,
        });
      }
      if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
        return reply.status(400).send({
          success: false,
          error: 'Zeitüberschreitung. Der Server antwortet nicht.',
        });
      }
      if (errorMessage.includes('AUTHENTICATIONFAILED') || errorMessage.includes('Invalid credentials') || errorMessage.includes('authentication')) {
        return reply.status(400).send({
          success: false,
          error: 'Anmeldung fehlgeschlagen. Bitte Benutzername und Passwort überprüfen.',
        });
      }

      return reply.status(400).send({
        success: false,
        error: `IMAP-Verbindung fehlgeschlagen: ${errorMessage}`,
      });
    }

    // Encrypt password
    const encryptedPassword = encrypt(password);

    // Save account
    const account = await prisma.emailAccount.upsert({
      where: { userId },
      update: {
        email,
        imapHost,
        imapPort: imapPort || 993,
        imapSecure: imapSecure !== false,
        smtpHost,
        smtpPort: smtpPort || 465,
        smtpSecure: smtpSecure !== false,
        username,
        password: encryptedPassword,
      },
      create: {
        userId,
        email,
        imapHost,
        imapPort: imapPort || 993,
        imapSecure: imapSecure !== false,
        smtpHost,
        smtpPort: smtpPort || 465,
        smtpSecure: smtpSecure !== false,
        username,
        password: encryptedPassword,
      },
    });

    return {
      success: true,
      data: { id: account.id, email: account.email },
    };
  });

  // Delete email account
  fastify.delete('/account', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId as string;

    await prisma.emailAccount.delete({
      where: { userId },
    }).catch(() => {});

    return { success: true, data: {} };
  });

  // Get folders
  fastify.get('/folders', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId as string;

    const account = await prisma.emailAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return reply.status(400).send({ success: false, error: 'No email account configured' });
    }

    const password = decrypt(account.password);

    try {
      const imapConfig = {
        user: account.username,
        password: password,
        host: account.imapHost,
        port: account.imapPort,
        connTimeout: 15000,
        authTimeout: 15000,
      };

      if (account.imapSecure) {
        (imapConfig as any).tls = true;
        (imapConfig as any).tlsOptions = {
          rejectUnauthorized: false,
        };
      }

      console.log('Connecting to IMAP:', account.imapHost, account.imapPort, 'tls:', account.imapSecure);

      const imap = new Imap(imapConfig);

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => resolve());
        imap.once('error', (err) => reject(err));
        imap.connect();
      });

      const boxes = await new Promise<Record<string, any>>((resolve, reject) => {
        imap.getBoxes((err, boxes) => {
          if (err) reject(err);
          else resolve(boxes);
        });
      });

      imap.end();

      // Flatten folder structure from nested object
      const flattenBoxes = (obj: any, path = ''): any[] => {
        const result: any[] = [];
        if (!obj || typeof obj !== 'object') return result;
        for (const [name, value] of Object.entries(obj || {})) {
          const fullPath = path ? `${path}/${name}` : name;
          result.push({ name, path: fullPath });
          if (value && typeof value === 'object' && 'children' in value) {
            result.push(...flattenBoxes((value as any).children, fullPath));
          }
        }
        return result;
      };

      const folders = flattenBoxes(boxes);

      return { success: true, data: folders };
    } catch (err: any) {
      console.error('IMAP folders error:', err);
      return reply.status(400).send({
        success: false,
        error: `Ordner konnten nicht geladen werden: ${err.message}`
      });
    }
  });

  // Get emails from a folder
  fastify.get('/emails/:folder', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: FolderParams; Querystring: { limit?: string; offset?: string } }>, reply: FastifyReply) => {
    const userId = request.user.userId as string;
    const { folder } = request.params;
    const limit = parseInt(request.query.limit || '50');
    const offset = parseInt(request.query.offset || '0');

    const account = await prisma.emailAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return reply.status(400).send({ success: false, error: 'No email account configured' });
    }

    const password = decrypt(account.password);

    try {
      const imapConfig = {
        user: account.username,
        password: password,
        host: account.imapHost,
        port: account.imapPort,
        connTimeout: 15000,
        authTimeout: 15000,
      };

      if (account.imapSecure) {
        (imapConfig as any).tls = true;
        (imapConfig as any).tlsOptions = { rejectUnauthorized: false };
      }

      const imap = new Imap(imapConfig);

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => resolve());
        imap.once('error', (err) => reject(err));
        imap.connect();
      });

      const box = await new Promise<any>((resolve, reject) => {
        imap.openBox(folder, (err, box) => {
          if (err) reject(err);
          else resolve(box);
        });
      });

      const searchCriteria = ['ALL'];

      console.log('Searching emails in folder:', folder);

      const messages = await new Promise<any[]>((resolve, reject) => {
        imap.search(searchCriteria, (err, messages) => {
          if (err) {
            console.error('Search error:', err);
            reject(err);
          } else {
            console.log('Found messages:', messages.length);
            resolve(messages);
          }
        });
      });

      // If no messages, return empty array
      if (messages.length === 0) {
        imap.end();
        return { success: true, data: { emails: [], total: 0, offset, limit } };
      }

      // Fetch message details
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: false,
        struct: true,
      };

      const fetchedMessages = await new Promise<any[]>((resolve, reject) => {
        const messagesToFetch = messages.slice(0, 50); // Limit to 50
        const f = imap.fetch(messagesToFetch, fetchOptions);

        const result: any[] = [];
        f.on('message', (msg: any) => {
          const parts: any[] = [];
          msg.on('body', (stream: any, info: any) => {
            let buffer = '';
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString('utf8');
            });
            stream.on('end', () => {
              parts.push({ which: info.which, body: buffer });
            });
          });
          msg.once('attributes', (attrs: any) => {
            result.push({ parts, attributes: attrs });
          });
        });
        f.on('end', () => resolve(result));
        f.on('error', reject);
      });

      // Get the messages in reverse order (newest first) and apply pagination
      const total = fetchedMessages.length;
      const paginatedMessages = fetchedMessages.slice(offset, offset + limit).reverse();

      const emails = paginatedMessages.map((message: any) => {
        const header = message.parts.find((p: any) => p.which === 'HEADER');
        const headerObj = header ? Imap.parseHeader(header.body) : {};

        return {
          id: message.attributes.uid,
          subject: headerObj.subject ? headerObj.subject[0] : '',
          from: headerObj.from ? headerObj.from[0] : '',
          to: headerObj.to ? headerObj.to[0] : '',
          date: headerObj.date ? headerObj.date[0] : '',
          seen: !message.attributes.flags.includes('\\Seen'),
          hasAttachments: message.attributes.struct?.some((s: any) => s.disposition?.type === 'attachment'),
        };
      });

      imap.end();

      return { success: true, data: { emails, total, offset, limit } };
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // Get single email
  fastify.get('/email/:folder/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Params: { folder: string; id: string } }>, reply: FastifyReply) => {
    const userId = request.user.userId as string;
    const { folder, id } = request.params;

    const account = await prisma.emailAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return reply.status(400).send({ success: false, error: 'No email account configured' });
    }

    const password = decrypt(account.password);

    try {
      const imapConfig = {
        user: account.username,
        password: password,
        host: account.imapHost,
        port: account.imapPort,
        connTimeout: 15000,
        authTimeout: 15000,
      };

      if (account.imapSecure) {
        (imapConfig as any).tls = true;
        (imapConfig as any).tlsOptions = { rejectUnauthorized: false };
      }

      const imap = new Imap(imapConfig);

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => resolve());
        imap.once('error', (err) => reject(err));
        imap.connect();
      });

      await new Promise<void>((resolve, reject) => {
        imap.openBox(folder, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const messages = await new Promise<any[]>((resolve, reject) => {
        imap.search([['UID', id]], { bodies: ['HEADER', 'TEXT', ''], struct: true }, (err, messages) => {
          if (err) reject(err);
          else resolve(messages);
        });
      });

      if (messages.length === 0) {
        imap.end();
        return reply.status(404).send({ success: false, error: 'Email not found' });
      }

      const message = messages[0];
      const header = message.parts.find((p: any) => p.which === 'HEADER');
      const textBody = message.parts.find((p: any) => p.which === 'TEXT');
      const headerObj = header ? Imap.parseHeader(header.body) : {};

      const attachments = message.attributes.struct
        ?.filter((s: any) => s.disposition?.type === 'attachment')
        .map((s: any) => ({
          filename: s.disposition?.params?.filename || 'attachment',
          mimeType: s.type,
          size: s.size,
        })) || [];

      const email = {
        id: message.attributes.uid,
        subject: headerObj.subject ? headerObj.subject[0] : '',
        from: headerObj.from ? headerObj.from[0] : '',
        to: headerObj.to ? headerObj.to[0] : '',
        cc: headerObj.cc ? headerObj.cc : [],
        bcc: headerObj.bcc ? headerObj.bcc : [],
        date: headerObj.date ? headerObj.date[0] : '',
        body: textBody ? textBody.body : '',
        html: textBody ? textBody.body : '',
        text: textBody ? textBody.body.replace(/<[^>]*>/g, '') : '',
        attachments,
      };

      imap.end();

      return { success: true, data: email };
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // Send email
  fastify.post('/send', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Body: SendEmailBody }>, reply: FastifyReply) => {
    const userId = request.user.userId as string;
    const { to, subject, body, html, cc, bcc } = request.body;

    if (!to || !subject || (!body && !html)) {
      return reply.status(400).send({ success: false, error: 'Recipient, subject and body are required' });
    }

    const account = await prisma.emailAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return reply.status(400).send({ success: false, error: 'No email account configured' });
    }

    const password = decrypt(account.password);

    try {
      const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        auth: {
          user: account.username,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: account.email,
        to,
        cc,
        bcc,
        subject,
        text: body,
        html: html || body.replace(/<[^>]*>/g, ''),
      });

      return { success: true, data: { sent: true } };
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // Test connection
  fastify.post('/test', { preHandler: [authMiddleware] }, async (request: FastifyRequest<{ Body: EmailAccountBody }>, reply: FastifyReply) => {
    const { imapHost, imapPort, imapSecure, username, password } = request.body;

    try {
      const port = imapPort || 993;
      const useSSL = imapSecure !== false;

      const imapConfig = {
        user: username,
        password: password,
        host: imapHost,
        port: port,
        connTimeout: 15000,
        authTimeout: 15000,
      };

      if (useSSL) {
        (imapConfig as any).tls = true;
        (imapConfig as any).tlsOptions = {
          rejectUnauthorized: false,
        };
      }

      console.log('Testing IMAP connection:', imapHost, port, 'ssl:', useSSL);

      const imap = new Imap(imapConfig);

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => resolve());
        imap.once('error', (err) => reject(err));
        imap.connect();
      });

      await new Promise<void>((resolve, reject) => {
        imap.openBox('INBOX', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      imap.end();

      return { success: true, data: { connected: true } };
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });
}
