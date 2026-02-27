interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}
declare class ApiClient {
    private accessToken;
    private refreshToken;
    setTokens(accessToken: string, refreshToken: string): void;
    clearTokens(): void;
    getAccessToken(): string;
    private request;
    private refreshAccessToken;
    login(email: string, password: string): Promise<ApiResponse<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        accessToken: string;
        refreshToken: string;
    }>>;
    logout(): Promise<void>;
    register(email: string, password: string, name: string, role?: string): Promise<any>;
    getMe(): Promise<ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: string;
        active: boolean;
        phone: string | null;
        birthday: string | null;
        employeeNumber: number;
    }>>;
    updateMe(data: {
        name?: string;
        email?: string;
        phone?: string;
        birthday?: string;
    }): Promise<ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: string;
        active: boolean;
        phone: string | null;
        birthday: string | null;
        employeeNumber: number;
    }>>;
    getUsers(): Promise<ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: string;
        active: boolean;
        phone: string | null;
        birthday: string | null;
        employeeNumber: number;
    }[]>>;
    getUsersWithEmail(): Promise<ApiResponse<{
        id: string;
        email: string;
        name: string;
    }[]>>;
    getEmployees(params?: {
        q?: string;
    }): Promise<ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: string;
        active: boolean;
        phone: string | null;
        birthday: string | null;
        employeeNumber: number;
    }[]>>;
    createUser(data: {
        email: string;
        password: string;
        name: string;
        role: string;
        phone?: string;
        birthday?: string;
    }): Promise<ApiResponse<unknown>>;
    updateUser(id: string, data: {
        name?: string;
        role?: string;
        active?: boolean;
    }): Promise<ApiResponse<unknown>>;
    deleteUser(id: string): Promise<ApiResponse<unknown>>;
    getNotes(params?: {
        q?: string;
        tag?: string;
        pinned?: boolean;
    }): Promise<ApiResponse<{
        id: string;
        title: string;
        content: string;
        tags: string[];
        pinned: boolean;
        createdAt: string;
        updatedAt: string;
    }[]>>;
    getNote(id: string): Promise<ApiResponse<{
        id: string;
        title: string;
        content: string;
        tags: string[];
        pinned: boolean;
        createdAt: string;
        updatedAt: string;
    }>>;
    createNote(data: {
        title: string;
        content?: string;
        tags?: string[];
        pinned?: boolean;
    }): Promise<ApiResponse<unknown>>;
    updateNote(id: string, data: {
        title?: string;
        content?: string;
        tags?: string[];
        pinned?: boolean;
    }): Promise<ApiResponse<unknown>>;
    deleteNote(id: string): Promise<ApiResponse<unknown>>;
    togglePinNote(id: string): Promise<ApiResponse<unknown>>;
    getEvents(params?: {
        start?: string;
        end?: string;
    }): Promise<ApiResponse<{
        id: string;
        title: string;
        description: string | null;
        location: string | null;
        startAt: string;
        endAt: string;
        reminderMinutes: number | null;
        orderId: string | null;
    }[]>>;
    createEvent(data: {
        title: string;
        description?: string;
        location?: string;
        startAt: string;
        endAt: string;
        reminderMinutes?: number;
        orderId?: string;
    }): Promise<ApiResponse<unknown>>;
    updateEvent(id: string, data: {
        title?: string;
        description?: string;
        location?: string;
        startAt?: string;
        endAt?: string;
        reminderMinutes?: number;
    }): Promise<ApiResponse<unknown>>;
    deleteEvent(id: string): Promise<ApiResponse<unknown>>;
    getCustomers(params?: {
        q?: string;
    }): Promise<ApiResponse<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
        ordersCount: number;
        createdAt: string;
        updatedAt: string;
    }[]>>;
    getCustomer(id: string): Promise<ApiResponse<{
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
    }>>;
    createCustomer(data: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
        notes?: string;
    }): Promise<ApiResponse<unknown>>;
    updateCustomer(id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        notes?: string;
    }): Promise<ApiResponse<unknown>>;
    deleteCustomer(id: string): Promise<ApiResponse<unknown>>;
    getOrders(params?: {
        status?: string;
        customerId?: string;
        dueSoon?: string;
        q?: string;
    }): Promise<ApiResponse<{
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
    }[]>>;
    getOrder(id: string): Promise<ApiResponse<{
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
    }>>;
    createOrder(data: {
        customerId: string;
        title: string;
        description?: string;
        status?: string;
        dueDate?: string;
        promisedDeliveryDate?: string;
    }): Promise<ApiResponse<unknown>>;
    updateOrder(id: string, data: {
        title?: string;
        description?: string;
        status?: string;
        dueDate?: string;
        promisedDeliveryDate?: string;
    }): Promise<ApiResponse<unknown>>;
    deleteOrder(id: string): Promise<ApiResponse<unknown>>;
    addOrderEvent(id: string, data: {
        type: string;
        note: string;
    }): Promise<ApiResponse<unknown>>;
    getFiles(params?: {
        customerId?: string;
        orderId?: string;
    }): Promise<ApiResponse<{
        id: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        customerId: string | null;
        orderId: string | null;
        createdAt: string;
    }[]>>;
    uploadFile(file: File, customerId?: string, orderId?: string): Promise<any>;
    deleteFile(id: string): Promise<ApiResponse<unknown>>;
    getFileUrl(id: string): string;
    getSpotifyAuthUrl(): Promise<ApiResponse<{
        url: string;
    }>>;
    spotifyCallback(code: string): Promise<ApiResponse<unknown>>;
    getSpotifyPlaylists(): Promise<ApiResponse<{
        id: string;
        name: string;
        images: Array<{
            url: string;
        }>;
        tracks: {
            total: number;
        };
    }[]>>;
    spotifySearch(q: string, type?: string, limit?: number): Promise<ApiResponse<{
        tracks?: {
            items: Array<{
                id: string;
                name: string;
                artists: Array<{
                    name: string;
                }>;
                album: {
                    name: string;
                    images: Array<{
                        url: string;
                    }>;
                };
                duration_ms: number;
                uri: string;
            }>;
        };
        artists?: {
            items: Array<{
                id: string;
                name: string;
                images: Array<{
                    url: string;
                }>;
            }>;
        };
    }>>;
    getSpotifyMe(): Promise<ApiResponse<{
        connected: boolean;
        user?: {
            id: string;
            display_name: string;
            email: string;
        };
    }>>;
    disconnectSpotify(): Promise<ApiResponse<unknown>>;
    getPermissions(): Promise<ApiResponse<{
        all: Array<{
            id: string;
            name: string;
            description: string;
            category: string;
        }>;
        grouped: Record<string, Array<{
            id: string;
            name: string;
            description: string;
            category: string;
        }>>;
    }>>;
    getUserPermissions(userId: string): Promise<ApiResponse<{
        id: string;
        name: string;
        description: string;
        category: string;
    }[]>>;
    setUserPermissions(userId: string, permissions: string[]): Promise<ApiResponse<{
        id: string;
        name: string;
        description: string;
        category: string;
    }[]>>;
    getMyPermissions(): Promise<ApiResponse<{
        id: string;
        name: string;
        description: string;
        category: string;
    }[]>>;
    getEmailAccount(): Promise<ApiResponse<{
        id: string;
        email: string;
        imapHost: string;
        imapPort: number;
        smtpHost: string;
        smtpPort: number;
        username: string;
        hasPassword: boolean;
    }>>;
    setupEmailAccount(data: {
        email: string;
        imapHost: string;
        imapPort?: number;
        imapSecure?: boolean;
        smtpHost: string;
        smtpPort?: number;
        smtpSecure?: boolean;
        username: string;
        password: string;
    }): Promise<ApiResponse<{
        id: string;
        email: string;
    }>>;
    deleteEmailAccount(): Promise<ApiResponse<unknown>>;
    getEmailFolders(): Promise<ApiResponse<{
        name: string;
        path: string;
        children: Array<{
            name: string;
            path: string;
        }>;
    }[]>>;
    getEmails(folder: string, limit?: number, offset?: number): Promise<ApiResponse<{
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
    }>>;
    getEmail(folder: string, id: number): Promise<ApiResponse<{
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
    }>>;
    sendEmail(data: {
        to: string;
        subject: string;
        body: string;
        html?: string;
        cc?: string;
        bcc?: string;
    }): Promise<ApiResponse<{
        sent: boolean;
    }>>;
    testEmailConnection(data: {
        imapHost: string;
        imapPort: number;
        imapSecure: boolean;
        username: string;
        password: string;
    }): Promise<ApiResponse<{
        connected: boolean;
    }>>;
}
export declare const api: ApiClient;
export {};
//# sourceMappingURL=api.d.ts.map