import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import ReportUserModal from '../components/ReportUserModal';

// ─── Cancel Session Modal ────────────────────────────────────────────────────
const CancelSessionModal = ({ session, onClose, onConfirm, loading }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(reason);
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--color-danger)' }}>Cancel Session</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                    Please provide a reason for cancelling this session with {session.partner?.name}.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="input-label">Reason for cancellation (Required)</label>
                        <textarea
                            className="input-field"
                            placeholder="I have an unexpected meeting..."
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn-danger" disabled={loading || !reason.trim()} style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? 'Cancelling...' : 'Confirm Cancel'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Schedule = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [cancelTarget, setCancelTarget] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['sessions-upcoming'],
        queryFn: () => api.get('/api/sessions/upcoming').then((r) => r.data),
    });

    const confirmMutation = useMutation({
        mutationFn: (id) => api.put(`/api/sessions/${id}/confirm`),
        onSuccess: () => {
            toast.success('Session confirmed!');
            qc.invalidateQueries(['sessions-upcoming']);
            qc.invalidateQueries(['sessions-history']);
            qc.invalidateQueries(['requests-received']);
            qc.invalidateQueries(['requests-sent']);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to confirm'),
    });

    const confirmScheduleMutation = useMutation({
        mutationFn: (id) => api.put(`/api/sessions/${id}/confirm-schedule`),
        onSuccess: () => {
            toast.success('Scheduled time confirmed!');
            qc.invalidateQueries(['sessions-upcoming']);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to confirm time'),
    });

    const noShowMutation = useMutation({
        mutationFn: (id) => api.put(`/api/sessions/${id}/noshow`),
        onSuccess: () => {
            toast.success('Marked as no-show');
            qc.invalidateQueries(['sessions-upcoming']);
            qc.invalidateQueries(['requests-received']);
            qc.invalidateQueries(['requests-sent']);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }) => api.put(`/api/sessions/${id}/cancel`, { reason }),
        onSuccess: () => {
            toast.success('Session cancelled');
            setCancelTarget(null);
            qc.invalidateQueries(['sessions-upcoming']);
            qc.invalidateQueries(['sessions-history']);
            qc.invalidateQueries(['requests-received']);
            qc.invalidateQueries(['requests-sent']);
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to cancel'),
    });

    const sessions = data?.sessions || [];

    const getPartner = (s) => s.teacherId?._id === user?._id ? s.learnerId : s.teacherId;
    const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    // Build a simple set of dates with sessions for the calendar
    const sessionDates = new Set(sessions.map((s) => format(new Date(s.date), 'yyyy-MM-dd')));
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Schedule</h1>
                <p className="page-subtitle">Your upcoming skill exchange sessions</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Calendar */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {format(today, 'MMMM yyyy')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                            <div key={d} style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '0.25rem', fontWeight: 600 }}>{d}</div>
                        ))}
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const hasSession = sessionDates.has(dateStr);
                            const isToday = day === today.getDate();
                            return (
                                <div key={day} style={{
                                    padding: '0.35rem', borderRadius: 6, fontSize: '0.8rem',
                                    background: hasSession ? 'rgba(99,102,241,0.25)' : isToday ? 'rgba(99,102,241,0.1)' : 'transparent',
                                    color: hasSession ? '#a5b4fc' : isToday ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontWeight: hasSession || isToday ? 700 : 400,
                                    border: isToday ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                                    cursor: hasSession ? 'pointer' : 'default',
                                }}>
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(99,102,241,0.25)', display: 'inline-block' }} />
                            Has session
                        </span>
                    </div>
                </div>

                {/* Session list */}
                <div>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</p>
                            <p>No upcoming sessions</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Accept a request and schedule a session to get started</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sessions.map((s) => {
                                const partner = getPartner(s);
                                const sessionEndTime = new Date(new Date(s.date).getTime() + (s.duration || 60) * 60000);
                                const isSessionEnded = new Date() > sessionEndTime;
                                const iAmTeacher = s.teacherId?._id === user?._id;
                                const myConfirmed = iAmTeacher ? s.teacherConfirmed : s.learnerConfirmed;

                                return (
                                    <div key={s._id} className="glass-card" style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            {partner?.avatar?.url ? (
                                                <img src={partner.avatar.url} alt={partner.name} className="avatar" style={{ width: 44, height: 44 }} />
                                            ) : (
                                                <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: '0.85rem' }}>{getInitials(partner?.name)}</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>with {partner?.name}</p>
                                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                                                            {s.requestId?.teachSkill} ↔ {s.requestId?.learnSkill}
                                                        </p>
                                                    </div>
                                                    <span className={`badge ${s.mode === 'online' ? 'badge-info' : 'badge-primary'}`}>{s.mode}</span>
                                                </div>
                                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                                                        📅 {format(new Date(s.date), 'MMM d, yyyy • h:mm a')}
                                                    </span>
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                                        ⏱ {s.duration} min
                                                    </span>
                                                    {!isSessionEnded && (
                                                        <span style={{ color: '#10b981', fontSize: '0.75rem' }}>
                                                            {new Date() > new Date(s.date)
                                                                ? '⏳ Ongoing currently'
                                                                : `⏳ ${formatDistanceToNow(new Date(s.date), { addSuffix: true })}`}
                                                        </span>
                                                    )}
                                                </div>
                                                {s.completionStatus === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                                                        {s.requestId?.senderId === user?._id ? (
                                                            <button className="btn-primary"
                                                                onClick={() => confirmScheduleMutation.mutate(s._id)}
                                                                disabled={confirmScheduleMutation.isPending}
                                                                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                                                ✓ Confirm Time
                                                            </button>
                                                        ) : (
                                                            <p style={{ color: 'var(--color-warning)', fontSize: '0.8rem', fontWeight: 500, alignSelf: 'center' }}>
                                                                ⏳ Waiting for partner to confirm
                                                            </p>
                                                        )}
                                                        <button className="btn-danger"
                                                            onClick={() => setCancelTarget({ ...s, partner })}
                                                            disabled={cancelMutation.isPending}
                                                            style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                                            Cancel Session
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {s.meetingLink && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    let link = s.meetingLink;
                                                                    if (!link.startsWith('http://') && !link.startsWith('https://')) {
                                                                        link = 'https://' + link;
                                                                    }
                                                                    window.open(link, '_blank');
                                                                }}
                                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.78rem', display: 'block', marginTop: '0.4rem', textDecoration: 'underline' }}>
                                                                🔗 Join Meeting
                                                            </button>
                                                        )}
                                                        {isSessionEnded && !myConfirmed && (
                                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                                                                <button className="btn-success"
                                                                    onClick={() => confirmMutation.mutate(s._id)}
                                                                    disabled={confirmMutation.isPending}
                                                                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                                                    ✓ Confirm Completed
                                                                </button>
                                                                <button className="btn-danger"
                                                                    onClick={() => noShowMutation.mutate(s._id)}
                                                                    disabled={noShowMutation.isPending}
                                                                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                                                    No-Show
                                                                </button>
                                                            </div>
                                                        )}
                                                        {myConfirmed && (
                                                            <p style={{ color: '#10b981', fontSize: '0.78rem', marginTop: '0.5rem' }}>✓ You confirmed this session</p>
                                                        )}
                                                        {!isSessionEnded && (
                                                            <div style={{ marginTop: '0.875rem' }}>
                                                                <button className="btn-danger"
                                                                    onClick={() => setCancelTarget({ ...s, partner })}
                                                                    disabled={cancelMutation.isPending}
                                                                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                                                    Cancel Session
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                                            <button
                                                                onClick={() => setReportTarget({ user: partner, session: s })}
                                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.72rem', textDecoration: 'underline', transition: 'color 0.2s' }}
                                                                onMouseOver={(e) => e.target.style.color = 'var(--color-danger)'}
                                                                onMouseOut={(e) => e.target.style.color = 'var(--color-text-muted)'}
                                                            >
                                                                🚩 Report User
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {cancelTarget && (
                <CancelSessionModal
                    session={cancelTarget}
                    onClose={() => setCancelTarget(null)}
                    onConfirm={(reason) => cancelMutation.mutate({ id: cancelTarget._id, reason })}
                    loading={cancelMutation.isPending}
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

export default Schedule;
