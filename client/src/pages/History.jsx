import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import ReportUserModal from '../components/ReportUserModal';

const statusBadge = {
    completed: 'badge-success',
    'no-show': 'badge-danger',
    cancelled: 'badge-danger',
};

// ─── Rate Session Modal ──────────────────────────────────────────────────────
const RateSessionModal = ({ session, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error('Please select a star rating');
        setLoading(true);
        try {
            await api.post(`/api/sessions/${session._id}/rate`, { rating, comment });
            toast.success('Thank you for your feedback!');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Rate your Session</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                    How was your experience learning with {session.teacherId?.name}?
                </p>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '2rem', padding: '0.2rem',
                                    color: star <= (hover || rating) ? '#fbbf24' : 'var(--color-border)',
                                    transition: 'color 0.2s',
                                }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="input-label">Public Review (optional)</label>
                        <textarea
                            className="input-field"
                            placeholder="They were really helpful with..."
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const History = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [rateTarget, setRateTarget] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);

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
                        const isSender = s.requestId?.senderId === user?._id;
                        const iAmTeacher = s.requestId?.receiverId === user?._id;
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
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {s.completionStatus === 'completed' && !s.isRated && s.learnerId?._id === user?._id && (
                                                    <button
                                                        onClick={() => setRateTarget(s)}
                                                        style={{
                                                            background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                                                            border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20,
                                                            padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600,
                                                            cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        ★ Rate Session
                                                    </button>
                                                )}
                                                <span className={`badge ${statusBadge[s.completionStatus] || 'badge-primary'}`}>
                                                    {s.completionStatus === 'completed' && s.isRated && s.learnerId?._id === user?._id ? 'Completed & Rated' : s.completionStatus}
                                                </span>
                                            </div>
                                        </div>
                                        {s.completionStatus === 'completed' && (
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', margin: '0.2rem 0' }}>
                                                {iAmTeacher ? '🎓 You taught' : '📚 You learned'}: <strong>{iAmTeacher ? s.requestId?.learnSkill : s.requestId?.teachSkill}</strong>
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: s.completionStatus === 'completed' ? 0 : '0.4rem' }}>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                                {format(new Date(s.date), 'MMMM d, yyyy')} &nbsp;·&nbsp; {s.duration} min &nbsp;·&nbsp; {s.mode}
                                            </p>
                                            <button
                                                onClick={() => setReportTarget({ user: partner, session: s })}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem', textDecoration: 'underline', transition: 'color 0.2s' }}
                                                onMouseOver={(e) => e.target.style.color = 'var(--color-danger)'}
                                                onMouseOut={(e) => e.target.style.color = 'var(--color-text-muted)'}
                                            >
                                                🚩 Report User
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {rateTarget && (
                <RateSessionModal
                    session={rateTarget}
                    onClose={() => setRateTarget(null)}
                    onSuccess={() => qc.invalidateQueries(['sessions-history'])}
                />
            )}

            {reportTarget && (
                <ReportUserModal
                    reportedUser={reportTarget.user}
                    session={reportTarget.session}
                    onClose={() => setReportTarget(null)}
                />
            )}
        </div>
    );
};

export default History;
