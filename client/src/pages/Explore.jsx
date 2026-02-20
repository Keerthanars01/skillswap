import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

const levelColors = { Beginner: 'badge-success', Intermediate: 'badge-warning', Advanced: 'badge-danger' };

const Explore = () => {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['explore', search, levelFilter, page],
        queryFn: () => api.get('/api/users/explore', {
            params: { search, level: levelFilter, page, limit: 12 }
        }).then((r) => r.data),
        keepPreviousData: true,
    });

    const users = data?.users || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / 12);

    const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Explore Users</h1>
                <p className="page-subtitle">Discover people with skills you want to learn</p>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 260px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                    <input
                        id="explore-search"
                        type="text"
                        className="input-field"
                        placeholder="Search by name or skill..."
                        value={search}
                        onChange={handleSearch}
                        style={{ paddingLeft: '2.25rem' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['', 'Beginner', 'Intermediate', 'Advanced'].map((l) => (
                        <button key={l} onClick={() => { setLevelFilter(l); setPage(1); }}
                            className={levelFilter === l ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '0.45rem 0.875rem', fontSize: '0.8rem' }}>
                            {l || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            {!isLoading && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                    {total} user{total !== 1 ? 's' : ''} found
                </p>
            )}

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
                </div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</p>
                    <p>No users found matching your search</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {users.map((u) => (
                            <div key={u._id} className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1rem' }}>
                                    {u.avatar?.url ? (
                                        <img src={u.avatar.url} alt={u.name} className="avatar" style={{ width: 48, height: 48 }} />
                                    ) : (
                                        <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: '0.9rem' }}>{getInitials(u.name)}</div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}</p>
                                        {u.location && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>📍 {u.location}</p>}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: u.reliabilityScore >= 75 ? '#10b981' : u.reliabilityScore >= 50 ? '#f59e0b' : '#ef4444'
                                            }} />
                                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Score: {u.reliabilityScore}</span>
                                        </div>
                                    </div>
                                </div>

                                {u.bio && (
                                    <p style={{
                                        color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: '0.875rem', lineHeight: 1.5,
                                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                    }}>
                                        {u.bio}
                                    </p>
                                )}

                                {u.skillsTeach?.length > 0 && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teaches</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {u.skillsTeach.slice(0, 3).map((s) => (
                                                <span key={s._id} className={`badge ${levelColors[s.level] || 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>{s.name}</span>
                                            ))}
                                            {u.skillsTeach.length > 3 && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>+{u.skillsTeach.length - 3}</span>}
                                        </div>
                                    </div>
                                )}

                                <Link to={`/profile/${u._id}`} style={{ display: 'block', marginTop: '0.875rem' }}>
                                    <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.82rem' }}>
                                        View Profile →
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>← Prev</button>
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={page === p ? 'btn-primary' : 'btn-secondary'}
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', minWidth: 36 }}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button className="btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Explore;
