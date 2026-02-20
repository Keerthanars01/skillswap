import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const ReliabilityRing = ({ score, size = 56 }) => {
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const r = (size / 2) - 5, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color }}>{score}</span>
            </div>
        </div>
    );
};

const RequestModal = ({ matchUser, theyTeach, theyLearn, myTeach, onClose, onSuccess }) => {
    const [teachSkill, setTeachSkill] = useState(theyLearn[0]?.name || '');
    const [learnSkill, setLearnSkill] = useState(theyTeach[0]?.name || '');
    const [message, setMessage] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!teachSkill || !learnSkill) return toast.error('Please select skills for the exchange');
        setLoading(true);
        try {
            await api.post('/api/requests', {
                receiverId: matchUser._id,
                teachSkill, learnSkill, message,
                proposedDuration: duration,
            });
            toast.success('Request sent!');
            onSuccess();
            onClose();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Request Exchange</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    with <strong>{matchUser.name}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="input-label">I will teach</label>
                        <select className="input-field" value={teachSkill} onChange={(e) => setTeachSkill(e.target.value)}>
                            {theyLearn.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                            {theyLearn.length === 0 && myTeach.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">I want to learn</label>
                        <select className="input-field" value={learnSkill} onChange={(e) => setLearnSkill(e.target.value)}>
                            {theyTeach.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Message (optional)</label>
                        <textarea className="input-field" rows={3} placeholder="Introduce yourself and explain what you'd like to exchange..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                        <label className="input-label">Proposed Duration (optional)</label>
                        <input className="input-field" placeholder="e.g. 4 weeks, 2x per week" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button className="btn-primary" onClick={submit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? 'Sending...' : 'Send Request'}
                        </button>
                        <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Matches = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [requestTarget, setRequestTarget] = useState(null);
    const [levelFilter, setLevelFilter] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['matches'],
        queryFn: () => api.get('/api/matches').then((r) => r.data),
    });

    const matches = data?.matches || [];
    const filtered = levelFilter
        ? matches.filter((m) => m.theyTeach.some((s) => s.level === levelFilter))
        : matches;

    const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Your Matches</h1>
                <p className="page-subtitle">Users with complementary skills — they teach what you want, you teach what they want</p>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['', 'Beginner', 'Intermediate', 'Advanced'].map((l) => (
                    <button key={l} onClick={() => setLevelFilter(l)}
                        className={levelFilter === l ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
                        {l || 'All Levels'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤝</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No matches found</p>
                    <p style={{ fontSize: '0.875rem' }}>Add more skills to your teach and learn lists to find matches</p>
                    <Link to="/skills"><button className="btn-primary" style={{ marginTop: '1rem' }}>Add Skills</button></Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filtered.map(({ user: u, matchScore, reliabilityScore, theyTeach, theyLearn }) => (
                        <div key={u._id} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                {u.avatar?.url ? (
                                    <img src={u.avatar.url} alt={u.name} className="avatar" style={{ width: 48, height: 48 }} />
                                ) : (
                                    <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: '0.9rem' }}>{getInitials(u.name)}</div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.name}</p>
                                    {u.location && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>📍 {u.location}</p>}
                                </div>
                                <ReliabilityRing score={reliabilityScore} size={52} />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                {theyTeach.slice(0, 2).map((s) => (
                                    <span key={s._id} className="badge badge-primary">🎓 {s.name}</span>
                                ))}
                                {theyLearn.slice(0, 2).map((s) => (
                                    <span key={s._id} className="badge badge-info">📚 {s.name}</span>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="badge badge-success">⚡ {matchScore} overlap</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link to={`/profile/${u._id}`}>
                                        <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>Profile</button>
                                    </Link>
                                    <button className="btn-primary" onClick={() => setRequestTarget({ user: u, theyTeach, theyLearn })}
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>
                                        Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {requestTarget && (
                <RequestModal
                    matchUser={requestTarget.user}
                    theyTeach={requestTarget.theyTeach}
                    theyLearn={requestTarget.theyLearn}
                    myTeach={user?.skillsTeach || []}
                    onClose={() => setRequestTarget(null)}
                    onSuccess={() => qc.invalidateQueries(['matches'])}
                />
            )}
        </div>
    );
};

export default Matches;
