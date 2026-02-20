import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const statusBadge = {
    completed: 'badge-success',
    'no-show': 'badge-danger',
    cancelled: 'badge-danger',
};

const History = () => {
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['sessions-history'],
        queryFn: () => api.get('/api/sessions/history').then((r) => r.data),
    });

    const sessions = data?.sessions || [];
    const getPartner = (s) => s.teacherId?._id === user?._id ? s.learnerId : s.teacherId;
    const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const completed = sessions.filter((s) => s.completionStatus === 'completed').length;
    const noShows = sessions.filter((s) => s.completionStatus === 'no-show').length;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Session History</h1>
                <p className="page-subtitle">All your past skill exchange sessions</p>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 160px' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{completed}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Completed</p>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 160px' }}>
                    <span style={{ fontSize: '1.5rem' }}>❌</span>
                    <div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{noShows}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>No-Shows</p>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 160px' }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                    <div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                            {sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0}%
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Completion Rate</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
                </div>
            ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</p>
                    <p>No session history yet</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Complete your first session to see it here</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {sessions.map((s) => {
                        const partner = getPartner(s);
                        const iAmTeacher = s.teacherId?._id === user?._id;
                        return (
                            <div key={s._id} className="glass-card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {partner?.avatar?.url ? (
                                        <img src={partner.avatar.url} alt={partner.name} className="avatar" style={{ width: 44, height: 44 }} />
                                    ) : (
                                        <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: '0.85rem' }}>{getInitials(partner?.name)}</div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>with {partner?.name}</p>
                                            <span className={`badge ${statusBadge[s.completionStatus] || 'badge-primary'}`}>
                                                {s.completionStatus}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', margin: '0.2rem 0' }}>
                                            {iAmTeacher ? '🎓 You taught' : '📚 You learned'}: <strong>{iAmTeacher ? s.requestId?.teachSkill : s.requestId?.learnSkill}</strong>
                                        </p>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                            {format(new Date(s.date), 'MMMM d, yyyy')} &nbsp;·&nbsp; {s.duration} min &nbsp;·&nbsp; {s.mode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default History;
