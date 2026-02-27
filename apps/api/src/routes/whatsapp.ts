import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { caption?: string; id: string };
        document?: { filename: string; id: string };
        audio?: { id: string };
        video?: { caption?: string; id: string };
      }>;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
      }>;
    };
  }>;
}

export default async function whatsappRoutes(server: FastifyInstance) {
  // Get WhatsApp config (admin only)
  server.get('/config', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;

    if (user.role !== 'ADMIN') {
      throw new Error('Nur Administratoren können diese Funktion nutzen');
    }

    const config = await prisma.whatsAppConfig.findFirst();
    if (!config) {
      return { success: true, data: null };
    }

    // Don't return the full access token
    return {
      success: true,
      data: {
        phoneNumberId: config.phoneNumberId,
        businessId: config.businessId,
      },
    };
  });

  // Save WhatsApp config (admin only)
  server.post('/config', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const user = request.user;

    if (user.role !== 'ADMIN') {
      throw new Error('Nur Administratoren können diese Funktion nutzen');
    }

    const { phoneNumberId, accessToken, businessId } = request.body as {
      phoneNumberId: string;
      accessToken: string;
      businessId?: string;
    };

    // Delete existing config
    await prisma.whatsAppConfig.deleteMany();

    // Create new config
    const config = await prisma.whatsAppConfig.create({
      data: {
        phoneNumberId,
        accessToken,
        businessId,
      },
    });

    return { success: true, message: 'WhatsApp Konfiguration gespeichert' };
  });

  // Get all conversations
  server.get('/conversations', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const conversations = await prisma.whatsAppConversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return { success: true, data: conversations };
  });

  // Get single conversation with messages
  server.get('/conversations/:conversationId', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const { conversationId } = request.params as { conversationId: string };

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation nicht gefunden');
    }

    // Mark as read
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return { success: true, data: conversation };
  });

  // Send message
  server.post('/messages/send', {
    preHandler: [server.authenticate],
  }, async (request) => {
    const { phoneNumber, message } = request.body as {
      phoneNumber: string;
      message: string;
    };

    const config = await prisma.whatsAppConfig.findFirst();
    if (!config) {
      throw new Error('WhatsApp nicht konfiguriert');
    }

    // Find or create conversation
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { phoneNumber },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: { phoneNumber },
      });
    }

    // Send via WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', responseData);

      // Save failed message
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          fromMe: true,
          body: message,
          status: 'failed',
          timestamp: new Date(),
        },
      });

      throw new Error('Nachricht konnte nicht gesendet werden');
    }

    const whatsappMessageId = responseData.messages?.[0]?.id;

    // Save message to database
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        messageId: whatsappMessageId,
        fromMe: true,
        body: message,
        status: 'sent',
        timestamp: new Date(),
      },
    });

    // Update conversation
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: message,
        lastMessageAt: new Date(),
      },
    });

    return { success: true, messageId: whatsappMessageId };
  });

  // Webhook - receive messages
  server.get('/webhook', async (request) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    // Verify token (you should set this to a secure value)
    const verifyToken = 'your_verify_token_here';

    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }

    return { success: false };
  });

  server.post('/webhook', async (request) => {
    const body = request.body as { entry?: WhatsAppWebhookEntry[] };

    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;
      const statuses = value?.statuses;

      const phoneNumberId = value?.metadata?.phone_number_id;

      if (!phoneNumberId) {
        return { success: true };
      }

      // Get config
      const config = await prisma.whatsAppConfig.findFirst({
        where: { phoneNumberId },
      });

      if (!config) {
        return { success: true };
      }

      // Handle incoming messages
      if (messages) {
        for (const msg of messages) {
          const phoneNumber = msg.from;
          const messageText = msg.text?.body || msg.image?.caption || msg.video?.caption || '[Media]';

          // Find or create conversation
          let conversation = await prisma.whatsAppConversation.findFirst({
            where: { phoneNumber },
          });

          if (!conversation) {
            conversation = await prisma.whatsAppConversation.create({
              data: { phoneNumber },
            });
          }

          // Save message
          await prisma.whatsAppMessage.create({
            data: {
              conversationId: conversation.id,
              messageId: msg.id,
              fromMe: false,
              body: messageText,
              status: 'received',
              timestamp: new Date(parseInt(msg.timestamp) * 1000),
            },
          });

          // Update conversation
          await prisma.whatsAppConversation.update({
            where: { id: conversation.id },
            data: {
              lastMessage: messageText,
              lastMessageAt: new Date(parseInt(msg.timestamp) * 1000),
              unreadCount: { increment: 1 },
            },
          });
        }
      }

      // Handle status updates
      if (statuses) {
        for (const status of statuses) {
          await prisma.whatsAppMessage.updateMany({
            where: { messageId: status.id },
            data: { status: status.status },
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false };
    }
  });
}
