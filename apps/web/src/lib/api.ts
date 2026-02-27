// Use localhost for local development
export const API_BASE = 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private accessToken: string | null = localStorage.getItem('accessToken');
  private refreshToken: string | null = localStorage.getItem('refreshToken');

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type if there's a body
    if (options.body) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry request with new token
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.error || 'Request failed');
        }
        return retryData;
      } else {
        this.clearTokens();
        window.location.href = '/login';
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  async register(email: string, password: string, name: string, role?: string) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    if (data.success) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }

  async getMe() {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      active: boolean;
      phone: string | null;
      birthday: string | null;
      employeeNumber: number;
    }>('/auth/me');
  }

  async updateMe(data: { name?: string; email?: string; phone?: string; birthday?: string }) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      active: boolean;
      phone: string | null;
      birthday: string | null;
      employeeNumber: number;
    }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers() {
    return this.request<Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      active: boolean;
      phone: string | null;
      birthday: string | null;
      employeeNumber: number;
    }>>('/users');
  }

  async getUsersWithEmail() {
    return this.request<Array<{
      id: string;
      email: string;
      name: string;
    }>>('/users/with-email');
  }

  async getEmployees(params?: { q?: string }) {
    const query = params?.q ? `?q=${encodeURIComponent(params.q)}` : '';
    return this.request<Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      active: boolean;
      phone: string | null;
      birthday: string | null;
      employeeNumber: number;
    }>>(`/users${query}`);
  }

  async createUser(data: { email: string; password: string; name: string; role: string; phone?: string; birthday?: string }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: { name?: string; role?: string; active?: boolean }) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Notes
  async getNotes(params?: { q?: string; tag?: string; pinned?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.pinned !== undefined) searchParams.set('pinned', String(params.pinned));
    const query = searchParams.toString();
    return this.request<Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
      pinned: boolean;
      createdAt: string;
      updatedAt: string;
    }>>(`/notes${query ? `?${query}` : ''}`);
  }

  async getNote(id: string) {
    return this.request<{
      id: string;
      title: string;
      content: string;
      tags: string[];
      pinned: boolean;
      createdAt: string;
      updatedAt: string;
    }>(`/notes/${id}`);
  }

  async createNote(data: { title: string; content?: string; tags?: string[]; pinned?: boolean }) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: { title?: string; content?: string; tags?: string[]; pinned?: boolean }) {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string) {
    return this.request(`/notes/${id}`, { method: 'DELETE' });
  }

  async togglePinNote(id: string) {
    return this.request(`/notes/${id}/pin`, { method: 'PATCH' });
  }

  // Calendar
  async getEvents(params?: { start?: string; end?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    const query = searchParams.toString();
    return this.request<Array<{
      id: string;
      title: string;
      description: string | null;
      location: string | null;
      startAt: string;
      endAt: string;
      reminderMinutes: number | null;
      orderId: string | null;
    }>>(`/calendar${query ? `?${query}` : ''}`);
  }

  async createEvent(data: {
    title: string;
    description?: string;
    location?: string;
    startAt: string;
    endAt: string;
    reminderMinutes?: number;
    orderId?: string;
  }) {
    return this.request('/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: {
    title?: string;
    description?: string;
    location?: string;
    startAt?: string;
    endAt?: string;
    reminderMinutes?: number;
  }) {
    return this.request(`/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/calendar/${id}`, { method: 'DELETE' });
  }

  // Customers
  async getCustomers(params?: { q?: string }) {
    const query = params?.q ? `?q=${encodeURIComponent(params.q)}` : '';
    return this.request<Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      notes: string | null;
      ordersCount: number;
      createdAt: string;
      updatedAt: string;
    }>>(`/customers${query}`);
  }

  async getCustomer(id: string) {
    return this.request<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
      orders: Array<{
        id: string;
        title: string;
        status: string;
        dueDate: string | null;
        createdAt: string;
      }>;
    }>(`/customers/${id}`);
  }

  async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(params?: { status?: string; customerId?: string; dueSoon?: string; q?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.customerId) searchParams.set('customerId', params.customerId);
    if (params?.dueSoon) searchParams.set('dueSoon', params.dueSoon);
    if (params?.q) searchParams.set('q', params.q);
    const query = searchParams.toString();
    return this.request<Array<{
      id: string;
      customerId: string;
      customerName: string;
      userId: string;
      userName: string;
      userEmployeeNumber: number;
      title: string;
      description: string | null;
      status: string;
      dueDate: string | null;
      promisedDeliveryDate: string | null;
      createdAt: string;
      updatedAt: string;
    }>>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string) {
    return this.request<{
      id: string;
      customerId: string;
      customerName: string;
      userId: string;
      userName: string;
      userEmployeeNumber: number;
      title: string;
      description: string | null;
      status: string;
      dueDate: string | null;
      promisedDeliveryDate: string | null;
      createdAt: string;
      updatedAt: string;
      events: Array<{
        id: string;
        type: string;
        note: string;
        createdAt: string;
      }>;
    }>(`/orders/${id}`);
  }

  async createOrder(data: {
    customerId: string;
    title: string;
    description?: string;
    status?: string;
    dueDate?: string;
    promisedDeliveryDate?: string;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: string;
    promisedDeliveryDate?: string;
  }) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, { method: 'DELETE' });
  }

  async addOrderEvent(id: string, data: { type: string; note: string }) {
    return this.request(`/orders/${id}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Files
  async getFiles(params?: { customerId?: string; orderId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.set('customerId', params.customerId);
    if (params?.orderId) searchParams.set('orderId', params.orderId);
    const query = searchParams.toString();
    return this.request<Array<{
      id: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      customerId: string | null;
      orderId: string | null;
      createdAt: string;
    }>>(`/files${query ? `?${query}` : ''}`);
  }

  async uploadFile(file: File, customerId?: string, orderId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (customerId) formData.append('customerId', customerId);
    if (orderId) formData.append('orderId', orderId);

    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  async deleteFile(id: string) {
    return this.request(`/files/${id}`, { method: 'DELETE' });
  }

  getFileUrl(id: string) {
    return `${API_BASE}/files/${id}`;
  }

  // Spotify
  async getSpotifyAuthUrl() {
    return this.request<{ url: string }>('/spotify/auth');
  }

  async spotifyCallback(code: string) {
    return this.request('/spotify/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getSpotifyPlaylists() {
    return this.request<Array<{
      id: string;
      name: string;
      images: Array<{ url: string }>;
      tracks: { total: number };
    }>>('/spotify/playlists');
  }

  async spotifySearch(q: string, type: string = 'track', limit: number = 20) {
    return this.request<{
      tracks?: { items: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images: Array<{ url: string }> };
        duration_ms: number;
        uri: string;
      }> };
      artists?: { items: Array<{
        id: string;
        name: string;
        images: Array<{ url: string }>;
      }> };
    }>(`/spotify/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`);
  }

  async getSpotifyMe() {
    return this.request<{
      connected: boolean;
      user?: { id: string; display_name: string; email: string };
    }>('/spotify/me');
  }

  async disconnectSpotify() {
    return this.request('/spotify/connection', { method: 'DELETE' });
  }

  // Permissions
  async getPermissions() {
    return this.request<Record<string, Array<{ id: string; name: string; description: string; category: string }>>>('/permissions');
  }

  async getUserPermissions(userId: string) {
    return this.request<string[]>(`/permissions/user/${userId}`);
  }

  async setUserPermissions(userId: string, permissionIds: string[]) {
    return this.request(`/permissions/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ permissionIds }),
    });
  }

  async getMyPermissions() {
    const user = await this.request<{ id: string }>('/auth/me');
    if (user.success && user.data) {
      return this.getUserPermissions(user.data.id);
    }
    return { success: false, data: [], error: 'User not found' };
  }

  // Email
  async getEmailAccount() {
    return this.request<{
      id: string;
      email: string;
      imapHost: string;
      imapPort: number;
      smtpHost: string;
      smtpPort: number;
      username: string;
      hasPassword: boolean;
    } | null>('/email/account');
  }

  async setupEmailAccount(data: {
    email: string;
    imapHost: string;
    imapPort?: number;
    imapSecure?: boolean;
    smtpHost: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    username: string;
    password: string;
  }) {
    return this.request<{ id: string; email: string }>('/email/account', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEmailAccount() {
    return this.request('/email/account', { method: 'DELETE' });
  }

  async getEmailFolders() {
    return this.request<Array<{ name: string; path: string; children: Array<{ name: string; path: string }> }>>('/email/folders');
  }

  async getEmails(folder: string, limit = 50, offset = 0) {
    return this.request<{
      emails: Array<{
        id: number;
        subject: string;
        from: string;
        to: string;
        date: string;
        seen: boolean;
        hasAttachments: boolean;
      }>;
      total: number;
      offset: number;
      limit: number;
    }>(`/email/emails/${encodeURIComponent(folder)}?limit=${limit}&offset=${offset}`);
  }

  async getEmail(folder: string, id: number) {
    return this.request<{
      id: number;
      subject: string;
      from: string;
      to: string;
      cc: string[];
      bcc: string[];
      date: string;
      body: string;
      text: string;
      html: string;
      attachments: Array<{
        filename: string;
        mimeType: string;
        size: number;
      }>;
    }>(`/email/email/${encodeURIComponent(folder)}/${id}`);
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    html?: string;
    cc?: string;
    bcc?: string;
  }) {
    return this.request<{ sent: boolean }>('/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async testEmailConnection(data: {
    imapHost: string;
    imapPort: number;
    imapSecure: boolean;
    username: string;
    password: string;
  }) {
    return this.request<{ connected: boolean }>('/email/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // License
  async validateLicense(key: string) {
    return this.request<{
      valid: boolean;
      data?: {
        customerId: string;
        customerName: string;
        expiresAt: string;
        maxUsers: number;
        features: string[];
      };
      error?: string;
    }>(`/license/validate?key=${encodeURIComponent(key)}`);
  }

  async getLicenseStatus() {
    return this.request<{
      active: boolean;
      customerId?: string;
      customerName?: string;
      expiresAt?: string;
      maxUsers?: number;
      currentUsers?: number;
      features?: string[];
    }>('/license/status');
  }

  async generateLicense(data: {
    customerId: string;
    customerName: string;
    expiresAt: string;
    maxUsers: number;
    features: string[];
  }) {
    return this.request<{ success: boolean; licenseKey: string }>('/license/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // WhatsApp
  async getWhatsAppConfig() {
    return this.request<{
      phoneNumberId: string;
      businessId: string | null;
    } | null>('/whatsapp/config');
  }

  async setWhatsAppConfig(data: {
    phoneNumberId: string;
    accessToken: string;
    businessId?: string;
  }) {
    return this.request('/whatsapp/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWhatsAppConversations() {
    return this.request<Array<{
      id: string;
      phoneNumber: string;
      name: string | null;
      lastMessage: string | null;
      lastMessageAt: Date | null;
      unreadCount: number;
    }>>('/whatsapp/conversations');
  }

  async getWhatsAppConversation(conversationId: string) {
    return this.request<{
      id: string;
      phoneNumber: string;
      name: string | null;
      messages: Array<{
        id: string;
        fromMe: boolean;
        body: string;
        status: string;
        timestamp: Date;
      }>;
    }>(`/whatsapp/conversations/${conversationId}`);
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string) {
    return this.request<{ messageId: string }>('/whatsapp/messages/send', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message }),
    });
  }
}

export const api = new ApiClient();
