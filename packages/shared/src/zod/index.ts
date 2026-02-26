import { z } from 'zod';

// ===========================================
// User Schemas
// ===========================================

// ===========================================
// User Roles
// ===========================================

export const UserRole = z.enum(['ADMIN', 'MANAGER', 'USER', 'GUEST']);
export type UserRole = z.infer<typeof UserRole>;

export const userRoleColors: Record<UserRole, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-800', label: 'Administrator' },
  MANAGER: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Manager' },
  USER: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Benutzer' },
  GUEST: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Gast' },
};

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRole,
  active: z.boolean(),
  phone: z.string().nullable(),
  birthday: z.string().nullable(),
  employeeNumber: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1),
  role: UserRole.default('USER'),
  phone: z.string().nullable().default(null),
  birthday: z.string().nullable().default(null),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: UserRole.optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ===========================================
// Note Schemas
// ===========================================

export const noteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string(),
  tags: z.array(z.string()),
  pinned: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export const noteSearchSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  pinned: z.boolean().optional(),
});

// ===========================================
// Calendar Event Schemas
// ===========================================

export const calendarEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reminderMinutes: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reminderMinutes: z.number().nullable().default(null),
  orderId: z.string().nullable().default(null),
});

export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  reminderMinutes: z.number().nullable().optional(),
  orderId: z.string().nullable().optional(),
});

// ===========================================
// Customer Schemas
// ===========================================

export const customerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().default(null),
  phone: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ===========================================
// Order Schemas
// ===========================================

export const OrderStatus = z.enum(['NEW', 'IN_PROGRESS', 'WAITING_MATERIAL', 'DONE', 'SHIPPED', 'CANCELED']);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const orderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: OrderStatus,
  dueDate: z.string().datetime().nullable(),
  promisedDeliveryDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().default(null),
  status: OrderStatus.default('NEW'),
  dueDate: z.string().datetime().nullable().default(null),
  promisedDeliveryDate: z.string().datetime().nullable().default(null),
});

export const updateOrderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: OrderStatus.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  promisedDeliveryDate: z.string().datetime().nullable().optional(),
});

// ===========================================
// Order Event Schemas
// ===========================================

export const OrderEventType = z.enum(['STATUS_CHANGE', 'NOTE', 'FILE_ADDED', 'CONTACT']);
export type OrderEventType = z.infer<typeof OrderEventType>;

export const orderEventSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  type: OrderEventType,
  note: z.string(),
  createdAt: z.string().datetime(),
});

export const createOrderEventSchema = z.object({
  type: OrderEventType,
  note: z.string().min(1),
});

// ===========================================
// File Schemas
// ===========================================

export const fileSchema = z.object({
  id: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  orderId: z.string().uuid().nullable(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  createdAt: z.string().datetime(),
});

export const createFileSchema = z.object({
  customerId: z.string().uuid().nullable(),
  orderId: z.string().uuid().nullable(),
});

// ===========================================
// Spotify Schemas
// ===========================================

export const spotifyPlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(z.object({
    url: z.string(),
  })),
  tracks: z.object({
    total: z.number(),
  }),
});

export const spotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.object({
    name: z.string(),
  })),
  album: z.object({
    name: z.string(),
    images: z.array(z.object({
      url: z.string(),
    })),
  }),
  duration_ms: z.number(),
  uri: z.string(),
});

export const spotifySearchSchema = z.object({
  q: z.string(),
  type: z.enum(['track', 'artist', 'album']).default('track'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

// ===========================================
// API Response Types
// ===========================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  });
