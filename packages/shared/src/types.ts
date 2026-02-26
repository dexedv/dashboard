// Re-export all Zod schemas as types
export * from './zod/index.js';

// JWT Payload type
export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// File info for upload
export interface FileUploadInfo {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

// Spotify types
export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day';

// Order with relations
export interface OrderWithCustomer {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string | null;
  status: 'NEW' | 'IN_PROGRESS' | 'WAITING_MATERIAL' | 'DONE' | 'SHIPPED' | 'CANCELED';
  dueDate: string | null;
  promisedDeliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Customer with orders count
export interface CustomerWithOrders {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
}

// Note with user info
export interface NoteWithUser {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
