import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const levelColors = { Beginner: 'badge-success', Intermediate: 'badge-warning', Advanced: 'badge-danger' };

const ReliabilityRing = ({ score }) => {
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const r = 36, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{score}</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>SCORE</span>
            </div>
        </div>
    );
};

// ─── Avatar Upload Component ─────────────────────────────────────────────────
const AvatarUpload = ({ profileUser, isOwn, onSuccess }) => {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);

    const getInitials = (name) =>
        name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Local preview
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);

        // Upload to backend → Cloudinary
        const formData = new FormData();
        formData.append('avatar', file);
        setUploading(true);
        try {
            await api.put('/api/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Profile photo updated!');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
            setPreview(null);
        } finally {
            setUploading(false);
            // Clear input so same file can be re-selected
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const avatarUrl = preview || profileUser.avatar?.url;

    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Avatar */}
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={profileUser.name}
                    className="avatar"
                    style={{ width: 90, height: 90, opacity: uploading ? 0.5 : 1, transition: 'opacity 0.2s' }}
                />
            ) : (
                <div
                    className="avatar-placeholder"
                    style={{ width: 90, height: 90, fontSize: '1.5rem', opacity: uploading ? 0.5 : 1 }}
                >
                    {getInitials(profileUser.name)}
                </div>
            )}

            {/* Upload button overlay — only for own profile */}
            {isOwn && (
                <>
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        title={uploading ? 'Uploading…' : 'Change photo'}
                        style={{
                            position: 'absolute', bottom: -4, right: -4,
                            width: 28, height: 28, borderRadius: '50%',
                            background: uploading
                                ? 'rgba(100,100,100,0.9)'
                                : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            border: '2px solid var(--color-bg)',
                            cursor: uploading ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', transition: 'all 0.2s',
                        }}
                    >
                        {uploading ? '⏳' : '📷'}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </>
            )}
        </div>
    );
};

// ─── Profile Page ─────────────────────────────────────────────────────────────
const Profile = () => {
    const { id } = useParams();
    const { user: currentUser, refreshUser } = useAuth();
    const isOwn = currentUser?._id === id;
    const qc = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', bio: '', location: '', availability: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['user', id],
        queryFn: () =>
            (isOwn ? api.get('/api/auth/me') : api.get(`/api/users/${id}`)).then((r) => r.data),
    });

    // Pre-populate form when data loads (React Query v5: no onSuccess callback)
    useEffect(() => {
        if (data?.user) {
            const u = data.user;
            setForm({
                name: u.name || '',
                bio: u.bio || '',
                location: u.location || '',
                availability: u.availability || '',
            });
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: (d) => api.put('/api/auth/profile', d),
        onSuccess: () => {
            toast.success('Profile updated!');
            setEditMode(false);
            refreshUser();
            qc.invalidateQueries({ queryKey: ['user', id] });
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
    });

    const handleAvatarSuccess = () => {
        refreshUser();
        qc.invalidateQueries({ queryKey: ['user', id] });
    };

    if (isLoading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
    );

    const profileUser = data?.user;
    if (!profileUser) return <p style={{ color: 'var(--color-text-muted)' }}>User not found.</p>;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* ─── Header Card ──────────────────────────────────────────── */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* Avatar with upload overlay */}
                    <AvatarUpload
                        profileUser={profileUser}
                        isOwn={isOwn}
                        onSuccess={handleAvatarSuccess}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {editMode ? (
                            /* ── Edit Mode ─────────────────────────────── */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <input
                                        className="input-field"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Bio</label>
                                    <textarea
                                        className="input-field"
                                        value={form.bio}
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                        placeholder="Tell others about yourself…"
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">📍 Location</label>
                                    <input
                                        className="input-field"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        placeholder="City, Country (e.g. Bangalore, India)"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">🕐 Availability</label>
                                    <input
                                        className="input-field"
                                        value={form.availability}
                                        onChange={(e) => setForm({ ...form, availability: e.target.value })}
                                        placeholder="e.g. Weekends 10AM–2PM, Weekday evenings"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => updateMutation.mutate(form)}
                                        disabled={updateMutation.isPending}
                                        style={{ padding: '0.5rem 1.25rem' }}
                                    >
                                        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setEditMode(false)}
                                        style={{ padding: '0.5rem 1.25rem' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── View Mode ─────────────────────────────── */
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profileUser.name}</h1>
                                    <ReliabilityRing score={profileUser.reliabilityScore || 50} />
                                </div>

                                {profileUser.bio && (
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                        {profileUser.bio}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    {profileUser.location ? (
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            📍 {profileUser.location}
                                        </span>
                                    ) : isOwn && (
                                        <span
                                            onClick={() => setEditMode(true)}
                                            style={{ color: 'var(--color-primary)', fontSize: '0.82rem', cursor: 'pointer', opacity: 0.7 }}
                                        >
                                            + Add location
                                        </span>
                                    )}
                                    {profileUser.availability && (
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            🕐 {profileUser.availability}
                                        </span>
                                    )}
                                </div>

                                {isOwn && (
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setEditMode(true)}
                                        style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                                    >
                                        ✏️ Edit Profile
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Upload hint for own profile */}
                {isOwn && !editMode && (
                    <p style={{
                        marginTop: '1rem', paddingTop: '1rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        color: 'var(--color-text-muted)', fontSize: '0.75rem',
                    }}>
                        📷 Click the camera icon on your avatar to change your profile photo
                    </p>
                )}
            </div>

            {/* ─── Skills Grid ──────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[
                    { title: '🎓 Skills I Can Teach', list: profileUser.skillsTeach, color: '#6366f1' },
                    { title: '📚 Skills I Want to Learn', list: profileUser.skillsLearn, color: '#8b5cf6' },
                ].map(({ title, list, color }) => (
                    <div key={title} className="glass-card" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color }}>{title}</h2>
                        {!list?.length ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No skills added yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {list.map((s) => (
                                    <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</p>
                                            {s.description && (
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{s.description}</p>
                                            )}
                                        </div>
                                        <span className={`badge ${levelColors[s.level] || 'badge-primary'}`}>{s.level}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Profile;
