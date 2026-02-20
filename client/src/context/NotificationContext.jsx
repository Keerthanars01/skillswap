import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/api/notifications');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            // Silently fail — non-critical
        }
    }, [isAuthenticated]);

    const markRead = useCallback(async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch { }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await api.put('/api/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
            setUnreadCount(0);
        } catch { }
    }, []);

    // Poll every 30 seconds when authenticated
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchNotifications]);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
};
