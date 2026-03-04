import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const StatCard = ({ icon, label, value, color }) => (
    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${color}20`, border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0
        }}>{icon}</div>
        <div>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{value}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>{label}</p>
        </div>
    </div>
);

const ReliabilityRing = ({ score }) => {
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const r = 28, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color }}>{score}</span>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();

    const { data: matchData } = useQuery({
        queryKey: ['matches'],
        queryFn: () => api.get('/api/matches').then((r) => r.data),
    });

    const { data: requestData } = useQuery({
        queryKey: ['requests-received'],
        queryFn: () => api.get('/api/requests/received').then((r) => r.data),
    });

    const { data: sessionData } = useQuery({
        queryKey: ['sessions-upcoming'],
        queryFn: () => api.get('/api/sessions/upcoming').then((r) => r.data),
    });

    const { data: historyData } = useQuery({
        queryKey: ['sessions-history'],
        queryFn: () => api.get('/api/sessions/history').then((r) => r.data),
    });

    const pending = requestData?.requests?.filter((r) => r.status === 'pending') || [];
    const taught = historyData?.sessions?.filter((s) => s.requestId?.receiverId === user?._id && s.completionStatus === 'completed') || [];
    const learned = historyData?.sessions?.filter((s) => s.requestId?.senderId === user?._id && s.completionStatus === 'completed') || [];
    const topMatches = matchData?.matches?.slice(0, 3) || [];
    const upcoming = sessionData?.sessions?.slice(0, 3) || [];

    const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
                <p className="page-subtitle">Here's what's happening with your skill exchanges</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon="🎓" label="Sessions Taught" value={taught.length} color="#6366f1" />
                <StatCard icon="📚" label="Sessions Learned" value={learned.length} color="#8b5cf6" />
                <StatCard icon="⭐" label="Reliability Score" value={user?.reliabilityScore || 50} color="#f59e0b" />
                <StatCard icon="📨" label="Pending Requests" value={pending.length} color="#06b6d4" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Top Matches */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>🤝 Top Matches</h2>
                        <Link to="/matches" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                            View all →
                        </Link>
                    </div>
                    {topMatches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</p>
                            <p style={{ fontSize: '0.875rem' }}>Add skills to see your matches</p>
                            <Link to="/skills"><button className="btn-primary" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Add Skills</button></Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            {topMatches.map(({ user: u, matchScore, reliabilityScore, theyTeach, theyLearn }) => (
                                <div key={u._id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                                    padding: '0.875rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    {u.avatar?.url ? (
                                        <img src={u.avatar.url} alt={u.name} className="avatar" style={{ width: 40, height: 40 }} />
                                    ) : (
                                        <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: '0.8rem' }}>{getInitials(u.name)}</div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</p>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                            Teaches: {theyTeach.map((s) => s.name).join(', ') || '—'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <span className="badge badge-primary" style={{ marginBottom: '0.25rem', display: 'block' }}>
                                            {matchScore} match
                                        </span>
                                        <Link to="/requests">
                                            <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>Request</button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Sessions */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📅 Upcoming Sessions</h2>
                        <Link to="/schedule" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                            View all →
                        </Link>
                    </div>
                    {upcoming.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</p>
                            <p style={{ fontSize: '0.875rem' }}>No upcoming sessions yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            {upcoming.map((s) => {
                                const partner = s.teacherId?._id === user?._id ? s.learnerId : s.teacherId;
                                return (
                                    <div key={s._id} style={{
                                        padding: '0.875rem', background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>with {partner?.name}</p>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                                    {s.requestId?.teachSkill} ↔ {s.requestId?.learnSkill}
                                                </p>
                                            </div>
                                            {s.completionStatus === 'pending' ? (
                                                <span className="badge badge-warning">Pending Conf</span>
                                            ) : (
                                                <span className="badge badge-info">{s.mode}</span>
                                            )}
                                        </div>
                                        <p style={{ color: 'var(--color-primary)', fontSize: '0.78rem', marginTop: '0.5rem', fontWeight: 600 }}>
                                            📅 {format(new Date(s.date), 'MMM d, yyyy • h:mm a')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Reliability Score */}
            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <ReliabilityRing score={user?.reliabilityScore || 50} />
                <div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Your Reliability Score</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Score is calculated from your session history. Complete sessions to increase it, no-shows decrease it.
                        {user?.reliabilityScore >= 75 ? ' 🟢 Excellent!' : user?.reliabilityScore >= 50 ? ' 🟡 Good — keep going!' : ' 🔴 Complete sessions to improve.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
