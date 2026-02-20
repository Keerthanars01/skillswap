import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';

const typeIcon = { match: '🤝', request: '📨', session: '📅', reminder: '🔔' };

const Notifications = () => {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn-secondary" onClick={markAllRead} style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                        ✓ Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</p>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No notifications yet</p>
                    <p style={{ fontSize: '0.875rem' }}>You'll be notified about matches, requests, and sessions here</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                    {notifications.map((n, i) => (
                        <div
                            key={n._id}
                            onClick={() => !n.readStatus && markRead(n._id)}
                            style={{
                                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                padding: '1.1rem 1.5rem',
                                borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                background: n.readStatus ? 'transparent' : 'rgba(99,102,241,0.06)',
                                cursor: n.readStatus ? 'default' : 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => { if (!n.readStatus) e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                            onMouseLeave={(e) => { if (!n.readStatus) e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                        >
                            <div style={{
                                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                            }}>
                                {typeIcon[n.type] || '🔔'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.25rem' }}>{n.message}</p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                            {!n.readStatus && (
                                <div style={{
                                    width: 9, height: 9, borderRadius: '50%',
                                    background: 'var(--color-primary)', flexShrink: 0, marginTop: 6
                                }} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
