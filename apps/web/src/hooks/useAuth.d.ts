interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    birthday?: string | null;
}
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    register: (email: string, password: string, name: string, role?: string) => Promise<void>;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=useAuth.d.ts.map