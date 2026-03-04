import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const statusBadge = {
    pending: 'badge-warning',
    accepted: 'badge-success',
    rejected: 'badge-danger',
    cancelled: 'badge-danger',
};

const ScheduleModal = ({ request, onClose, onSuccess }) => {
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState(60);
    const [mode, setMode] = useState('online');
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!date) return toast.error('Please select a date and time');
        if (mode === 'online' && !link.trim()) return toast.error('Please provide a meeting link');
        setLoading(true);
        try {
            await api.post('/api/sessions', {
                requestId: request._id,
                date, duration: Number(duration), mode, meetingLink: link,
            });
            toast.success('Session scheduled!');
            onSuccess();
            onClose();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to schedule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>📅 Schedule Session</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="input-label">Date & Time</label>
                        <input type="datetime-local" className="input-field" value={date} onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)} />
                    </div>
                    <div>
                        <label className="input-label">Duration (minutes)</label>
                        <select className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)}>
                            {[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Mode</label>
                        <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value)}>
                            <option value="online">Online</option>
                            <option value="offline">In Person</option>
                        </select>
                    </div>
                    {mode === 'online' && (
                        <div>
                            <label className="input-label">Meeting Link</label>
                            <input className="input-field" placeholder="https://meet.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} />
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', position: 'sticky', bottom: '-2rem', background: 'var(--color-surface)', padding: '1rem 0 2rem 0', zIndex: 10, borderTop: '1px solid var(--color-border)' }}>
                        <button className="btn-primary" onClick={submit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? 'Scheduling...' : 'Schedule'}
                        </button>
                        <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestCard = ({ request, type, onAction, onSchedule }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState('');

    const partner = type === 'received' ? request.senderId : request.receiverId;
    const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const act = async (action) => {
        setLoading(action);
        try {
            if (action === 'accept') await api.put(`/api/requests/${request._id}/accept`);
            else if (action === 'reject') await api.put(`/api/requests/${request._id}/reject`);
            else if (action === 'cancel') await api.delete(`/api/requests/${request._id}`);
            toast.success(`Request ${action}ed`);
            onAction();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Action failed');
        } finally {
            setLoading('');
        }
    };

    return (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {partner?.avatar?.url ? (
                    <img src={partner.avatar.url} alt={partner.name} className="avatar" style={{ width: 44, height: 44 }} />
                ) : (
                    <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: '0.85rem' }}>{getInitials(partner?.name)}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{partner?.name}</p>
                        <span className={`badge ${statusBadge[request.status]}`}>{request.status}</span>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', margin: '0.3rem 0' }}>
                        🎓 Teaches: <strong>{request.teachSkill}</strong> &nbsp;|&nbsp; 📚 Learns: <strong>{request.learnSkill}</strong>
                    </p>
                    {request.message && <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '0.3rem' }}>"{request.message}"</p>}
                    {request.proposedDuration && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>⏱ {request.proposedDuration}</p>}
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </div>

            {/* Actions */}
            {type === 'received' && request.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-success" onClick={() => act('accept')} disabled={!!loading} style={{ flex: 1 }}>
                        {loading === 'accept' ? '...' : '✓ Accept'}
                    </button>
                    <button className="btn-danger" onClick={() => act('reject')} disabled={!!loading} style={{ flex: 1 }}>
                        {loading === 'reject' ? '...' : '✕ Reject'}
                    </button>
                </div>
            )}
            {type === 'sent' && request.status === 'pending' && (
                <button className="btn-danger" onClick={() => act('cancel')} disabled={!!loading}
                    style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem' }}>
                    {loading === 'cancel' ? '...' : 'Cancel Request'}
                </button>
            )}
            {request.status === 'accepted' && type === 'received' && (
                <button className="btn-primary" onClick={onSchedule}
                    style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center', padding: '0.5rem' }}>
                    📅 Schedule Session
                </button>
            )}
            {request.status === 'accepted' && type === 'sent' && (
                <div style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', textAlign: 'center', color: 'var(--color-primary)', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
                    Waiting for other party to schedule.
                </div>
            )}
        </div>
    );
};

const Requests = () => {
    const [tab, setTab] = useState('received');
    const [scheduleTarget, setScheduleTarget] = useState(null);
    const qc = useQueryClient();

    const { data: received, isLoading: loadR } = useQuery({
        queryKey: ['requests-received'],
        queryFn: () => api.get('/api/requests/received').then((r) => r.data),
    });

    const { data: sent, isLoading: loadS } = useQuery({
        queryKey: ['requests-sent'],
        queryFn: () => api.get('/api/requests/sent').then((r) => r.data),
    });

    const refresh = () => {
        qc.invalidateQueries(['requests-received']);
        qc.invalidateQueries(['requests-sent']);
    };

    const list = tab === 'received' ? received?.requests : sent?.requests;
    const isLoading = tab === 'received' ? loadR : loadS;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Exchange Requests</h1>
                <p className="page-subtitle">Manage incoming and outgoing skill exchange requests</p>
            </div>

            <div className="tab-bar">
                <button className={`tab-btn${tab === 'received' ? ' active' : ''}`} onClick={() => setTab('received')}>
                    📨 Received {received?.requests?.filter((r) => r.status === 'pending').length > 0 && `(${received.requests.filter((r) => r.status === 'pending').length})`}
                </button>
                <button className={`tab-btn${tab === 'sent' ? ' active' : ''}`} onClick={() => setTab('sent')}>
                    📤 Sent
                </button>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
                </div>
            ) : !list?.length ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📨</p>
                    <p>No {tab} requests yet</p>
                    {tab === 'received' && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>When someone sends you a request, it will appear here</p>}
                    {tab === 'sent' && <Link to="/matches"><button className="btn-primary" style={{ marginTop: '1rem' }}>Find Matches</button></Link>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                    {list.map((r) => <RequestCard key={r._id} request={r} type={tab} onAction={refresh} onSchedule={() => setScheduleTarget(r)} />)}
                </div>
            )}

            {scheduleTarget && (
                <ScheduleModal
                    request={scheduleTarget}
                    onClose={() => setScheduleTarget(null)}
                    onSuccess={() => {
                        qc.invalidateQueries(['sessions-upcoming']);
                        refresh();
                        setScheduleTarget(null);
                    }}
                />
            )}
        </div>
    );
};

export default Requests;
