import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const navigate = useNavigate();
    const [showNotifs, setShowNotifs] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notifsRef = useRef(null);
    const userMenuRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (name) =>
        name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

    const getNotifIcon = (type) => {
        const icons = { match: '🤝', request: '📨', session: '📅', reminder: '🔔' };
        return icons[type] || '🔔';
    };

    return (
        <nav className="navbar">
            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem'
                }}>⚡</div>
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }} className="gradient-text">SkillSwap</span>
            </Link>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user ? (
                    <>
                        {/* Notification Bell */}
                        <div ref={notifsRef} style={{ position: 'relative' }}>
                            <button
                                id="notif-bell"
                                onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
                                style={{
                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', fontSize: '1.1rem', transition: 'all 0.2s'
                                }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -4, right: -4,
                                        background: '#ef4444', color: 'white',
                                        borderRadius: '50%', width: 18, height: 18,
                                        fontSize: '0.65rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid var(--color-bg)'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifs && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '110%',
                                    width: 340, background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)', borderRadius: 16,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: 700 }}>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} style={{
                                                background: 'none', border: 'none', color: 'var(--color-primary)',
                                                fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                                            }}>Mark all read</button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                No notifications yet
                                            </div>
                                        ) : (
                                            notifications.slice(0, 10).map((n) => (
                                                <div key={n._id} style={{
                                                    padding: '0.875rem 1.25rem',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                    background: n.readStatus ? 'transparent' : 'rgba(99,102,241,0.06)',
                                                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
                                                }}>
                                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{getNotifIcon(n.type)}</span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.2rem' }}>{n.message}</p>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {!n.readStatus && (
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: 'var(--color-primary)', flexShrink: 0, marginTop: 4
                                                        }} />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                                        <Link to="/notifications" onClick={() => setShowNotifs(false)}
                                            style={{ color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                                            View all notifications →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Avatar Menu */}
                        <div ref={userMenuRef} style={{ position: 'relative' }}>
                            <button
                                id="user-avatar-btn"
                                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                {user.avatar?.url ? (
                                    <img src={user.avatar.url} alt={user.name} className="avatar" style={{ width: 38, height: 38 }} />
                                ) : (
                                    <div className="avatar-placeholder" style={{ width: 38, height: 38, fontSize: '0.85rem' }}>
                                        {getInitials(user.name)}
                                    </div>
                                )}
                            </button>

                            {showUserMenu && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '110%',
                                    width: 200, background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)', borderRadius: 12,
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 200, overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</p>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{user.email}</p>
                                    </div>
                                    {[
                                        { to: `/profile/${user._id}`, label: '👤 My Profile' },
                                        { to: '/skills', label: '🎯 My Skills' },
                                        { to: '/dashboard', label: '📊 Dashboard' },
                                    ].map(({ to, label }) => (
                                        <Link key={to} to={to} onClick={() => setShowUserMenu(false)} style={{
                                            display: 'block', padding: '0.65rem 1rem',
                                            color: 'var(--color-text)', textDecoration: 'none',
                                            fontSize: '0.875rem', transition: 'background 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(99,102,241,0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >{label}</Link>
                                    ))}
                                    <div style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <button onClick={handleLogout} style={{
                                            width: '100%', padding: '0.65rem 1rem', background: 'none',
                                            border: 'none', color: '#f87171', fontSize: '0.875rem',
                                            textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >🚪 Sign Out</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to="/login">
                            <button className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Sign In</button>
                        </Link>
                        <Link to="/register">
                            <button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Join Free</button>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
