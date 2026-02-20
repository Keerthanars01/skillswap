import { createContext, useContext, useState, useCallback } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('skillswap_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() =>
        localStorage.getItem('skillswap_token') || null
    );

    const login = useCallback((userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('skillswap_token', authToken);
        localStorage.setItem('skillswap_user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
    }, []);

    // Refresh user data from server (e.g. after profile update)
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await api.get('/api/auth/me');
            setUser(data.user);
            localStorage.setItem('skillswap_user', JSON.stringify(data.user));
        } catch {
            // Token expired or invalid — logout
            logout();
        }
    }, [logout]);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
