import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '@/lib/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            api.getMe()
                .then((response) => {
                if (response.success) {
                    setUser(response.data);
                }
            })
                .catch(() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            })
                .finally(() => {
                setIsLoading(false);
            });
        }
        else {
            setIsLoading(false);
        }
    }, []);
    const login = async (email, password) => {
        const response = await api.login(email, password);
        if (response.success) {
            setUser(response.data.user);
        }
        else {
            throw new Error(response.error || 'Login failed');
        }
    };
    const register = async (email, password, name, role) => {
        const response = await api.register(email, password, name, role);
        if (response.success) {
            setUser(response.data.user);
        }
        else {
            throw new Error(response.error || 'Registration failed');
        }
    };
    const logout = async () => {
        await api.logout();
        setUser(null);
    };
    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            updateUser,
            register,
        }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
