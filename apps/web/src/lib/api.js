const API_BASE = import.meta.env.VITE_API_URL || '/api';
class ApiClient {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    setTokens(accessToken, refreshToken) {
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
    async request(endpoint, options = {}) {
        const headers = {
            ...options.headers,
        };
        // Only set Content-Type if there's a body
        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
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
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
                    ...options,
                    headers,
                });
                const retryData = await retryResponse.json();
                if (!retryResponse.ok) {
                    throw new Error(retryData.error || 'Request failed');
                }
                return retryData;
            }
            else {
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
    async refreshAccessToken() {
        if (!this.refreshToken)
            return false;
        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });
            if (!response.ok)
                return false;
            const data = await response.json();
            this.setTokens(data.data.accessToken, data.data.refreshToken);
            return true;
        }
        catch {
            return false;
        }
    }
    // Auth
    async login(email, password) {
        const response = await this.request('/auth/login', {
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
        }
        finally {
            this.clearTokens();
        }
    }
    async register(email, password, name, role) {
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
        return this.request('/auth/me');
    }
    async updateMe(data) {
        return this.request('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    // Users
    async getUsers() {
        return this.request('/users');
    }
    async getUsersWithEmail() {
        return this.request('/users/with-email');
    }
    async getEmployees(params) {
        const query = params?.q ? `?q=${encodeURIComponent(params.q)}` : '';
        return this.request(`/users${query}`);
    }
    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    async deleteUser(id) {
        return this.request(`/users/${id}`, { method: 'DELETE' });
    }
    // Notes
    async getNotes(params) {
        const searchParams = new URLSearchParams();
        if (params?.q)
            searchParams.set('q', params.q);
        if (params?.tag)
            searchParams.set('tag', params.tag);
        if (params?.pinned !== undefined)
            searchParams.set('pinned', String(params.pinned));
        const query = searchParams.toString();
        return this.request(`/notes${query ? `?${query}` : ''}`);
    }
    async getNote(id) {
        return this.request(`/notes/${id}`);
    }
    async createNote(data) {
        return this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateNote(id, data) {
        return this.request(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteNote(id) {
        return this.request(`/notes/${id}`, { method: 'DELETE' });
    }
    async togglePinNote(id) {
        return this.request(`/notes/${id}/pin`, { method: 'PATCH' });
    }
    // Calendar
    async getEvents(params) {
        const searchParams = new URLSearchParams();
        if (params?.start)
            searchParams.set('start', params.start);
        if (params?.end)
            searchParams.set('end', params.end);
        const query = searchParams.toString();
        return this.request(`/calendar${query ? `?${query}` : ''}`);
    }
    async createEvent(data) {
        return this.request('/calendar', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateEvent(id, data) {
        return this.request(`/calendar/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteEvent(id) {
        return this.request(`/calendar/${id}`, { method: 'DELETE' });
    }
    // Customers
    async getCustomers(params) {
        const query = params?.q ? `?q=${encodeURIComponent(params.q)}` : '';
        return this.request(`/customers${query}`);
    }
    async getCustomer(id) {
        return this.request(`/customers/${id}`);
    }
    async createCustomer(data) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateCustomer(id, data) {
        return this.request(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteCustomer(id) {
        return this.request(`/customers/${id}`, { method: 'DELETE' });
    }
    // Orders
    async getOrders(params) {
        const searchParams = new URLSearchParams();
        if (params?.status)
            searchParams.set('status', params.status);
        if (params?.customerId)
            searchParams.set('customerId', params.customerId);
        if (params?.dueSoon)
            searchParams.set('dueSoon', params.dueSoon);
        if (params?.q)
            searchParams.set('q', params.q);
        const query = searchParams.toString();
        return this.request(`/orders${query ? `?${query}` : ''}`);
    }
    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }
    async createOrder(data) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateOrder(id, data) {
        return this.request(`/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteOrder(id) {
        return this.request(`/orders/${id}`, { method: 'DELETE' });
    }
    async addOrderEvent(id, data) {
        return this.request(`/orders/${id}/events`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    // Files
    async getFiles(params) {
        const searchParams = new URLSearchParams();
        if (params?.customerId)
            searchParams.set('customerId', params.customerId);
        if (params?.orderId)
            searchParams.set('orderId', params.orderId);
        const query = searchParams.toString();
        return this.request(`/files${query ? `?${query}` : ''}`);
    }
    async uploadFile(file, customerId, orderId) {
        const formData = new FormData();
        formData.append('file', file);
        if (customerId)
            formData.append('customerId', customerId);
        if (orderId)
            formData.append('orderId', orderId);
        const headers = {};
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
    async deleteFile(id) {
        return this.request(`/files/${id}`, { method: 'DELETE' });
    }
    getFileUrl(id) {
        return `${API_BASE}/files/${id}`;
    }
    // Spotify
    async getSpotifyAuthUrl() {
        return this.request('/spotify/auth');
    }
    async spotifyCallback(code) {
        return this.request('/spotify/callback', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }
    async getSpotifyPlaylists() {
        return this.request('/spotify/playlists');
    }
    async spotifySearch(q, type = 'track', limit = 20) {
        return this.request(`/spotify/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`);
    }
    async getSpotifyMe() {
        return this.request('/spotify/me');
    }
    async disconnectSpotify() {
        return this.request('/spotify/connection', { method: 'DELETE' });
    }
    // Permissions
    async getPermissions() {
        return this.request('/users/permissions');
    }
    async getUserPermissions(userId) {
        return this.request(`/users/${userId}/permissions`);
    }
    async setUserPermissions(userId, permissions) {
        return this.request(`/users/${userId}/permissions`, {
            method: 'POST',
            body: JSON.stringify({ permissions }),
        });
    }
    async getMyPermissions() {
        return this.request('/users/me/permissions');
    }
    // Email
    async getEmailAccount() {
        return this.request('/email/account');
    }
    async setupEmailAccount(data) {
        return this.request('/email/account', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async deleteEmailAccount() {
        return this.request('/email/account', { method: 'DELETE' });
    }
    async getEmailFolders() {
        return this.request('/email/folders');
    }
    async getEmails(folder, limit = 50, offset = 0) {
        return this.request(`/email/emails/${encodeURIComponent(folder)}?limit=${limit}&offset=${offset}`);
    }
    async getEmail(folder, id) {
        return this.request(`/email/email/${encodeURIComponent(folder)}/${id}`);
    }
    async sendEmail(data) {
        return this.request('/email/send', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async testEmailConnection(data) {
        return this.request('/email/test', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}
export const api = new ApiClient();
