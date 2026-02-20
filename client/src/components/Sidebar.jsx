import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/skills', icon: '🎯', label: 'My Skills' },
    { to: '/matches', icon: '🤝', label: 'Matches' },
    { to: '/requests', icon: '📨', label: 'Requests' },
    { to: '/schedule', icon: '📅', label: 'Schedule' },
    { to: '/history', icon: '📋', label: 'History' },
    { to: '/explore', icon: '🔍', label: 'Explore' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
];

const Sidebar = () => (
    <aside className="sidebar">
        <p style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--color-text-muted)', textTransform: 'uppercase',
            padding: '0 0.875rem', marginBottom: '0.75rem'
        }}>Navigation</p>
        {navItems.map(({ to, icon, label }) => (
            <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <span>{label}</span>
            </NavLink>
        ))}
    </aside>
);

export default Sidebar;
