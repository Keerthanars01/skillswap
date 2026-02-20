import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/axios';

// ─── Curated skill suggestion list ────────────────────────────────────────────
const SKILL_SUGGESTIONS = [
    // Programming
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift',
    'Kotlin', 'PHP', 'Ruby', 'R', 'MATLAB', 'Scala', 'Dart', 'Lua',
    // Web
    'React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'Node.js', 'Express.js',
    'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails',
    'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'GraphQL', 'REST APIs', 'WebSockets',
    // Data & ML
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Data Analysis', 'Data Visualization', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Tableau', 'Power BI', 'Excel', 'Statistics', 'Scikit-learn',
    // Design
    'UI/UX Design', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD',
    'Sketch', 'InDesign', 'Canva', 'Blender', 'After Effects', 'Premiere Pro',
    'Graphic Design', 'Motion Design', 'Logo Design', 'Branding',
    // DevOps / Cloud
    'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'CI/CD', 'Linux',
    'Bash Scripting', 'Terraform', 'Ansible', 'Git', 'GitHub Actions',
    // Music
    'Guitar', 'Piano', 'Drums', 'Bass Guitar', 'Violin', 'Music Production',
    'Singing', 'Music Theory', 'DJ-ing', 'Sound Design', 'GarageBand', 'Ableton Live',
    // Languages
    'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Korean', 'Arabic',
    'Hindi', 'Portuguese', 'Italian', 'Russian',
    // Business
    'Digital Marketing', 'SEO', 'Content Writing', 'Copywriting', 'Social Media Marketing',
    'Project Management', 'Agile / Scrum', 'Product Management', 'Public Speaking',
    'Business Analysis', 'Financial Modelling', 'Accounting',
    // Creative
    'Photography', 'Video Editing', 'Videography', 'Creative Writing', 'Illustration',
    'Animation', '3D Modelling', 'Game Development', 'Unity', 'Unreal Engine',
    // Health & Lifestyle
    'Yoga', 'Meditation', 'Personal Training', 'Nutrition', 'Cooking', 'Baking',
];

// ─── Autocomplete Input ─────────────────────────────────────────────────────
const SkillAutocomplete = ({ value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef(null);

    const filtered = value.trim().length > 0
        ? SKILL_SUGGESTIONS.filter((s) =>
            s.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 8)
        : [];

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = (skill) => {
        onChange(skill);
        setOpen(false);
        setHighlighted(0);
    };

    const handleKeyDown = (e) => {
        if (!open || filtered.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            select(filtered[highlighted]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <input
                type="text"
                className="input-field"
                placeholder={placeholder}
                value={value}
                onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0); }}
                onFocus={() => value.trim().length > 0 && setOpen(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                    background: 'var(--color-surface)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                    {filtered.map((skill, i) => (
                        <div
                            key={skill}
                            onMouseDown={() => select(skill)}
                            style={{
                                padding: '0.6rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                background: i === highlighted ? 'rgba(99,102,241,0.18)' : 'transparent',
                                color: i === highlighted ? '#a5b4fc' : 'var(--color-text)',
                                transition: 'background 0.1s',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}
                            onMouseEnter={() => setHighlighted(i)}
                        >
                            <span style={{ fontSize: '0.7rem', opacity: 0.5, flexShrink: 0 }}>🔍</span>
                            {/* Bold the matching portion */}
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(() => {
                                    const idx = skill.toLowerCase().indexOf(value.toLowerCase());
                                    if (idx === -1) return skill;
                                    return (
                                        <>
                                            {skill.slice(0, idx)}
                                            <strong style={{ color: '#818cf8' }}>{skill.slice(idx, idx + value.length)}</strong>
                                            {skill.slice(idx + value.length)}
                                        </>
                                    );
                                })()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Level badge colors ─────────────────────────────────────────────────────
const levelColors = { Beginner: 'badge-success', Intermediate: 'badge-warning', Advanced: 'badge-danger' };

// ─── Add Skill Modal ─────────────────────────────────────────────────────────
const AddSkillModal = ({ type, onClose, onSuccess }) => {
    const [skillName, setSkillName] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!skillName.trim()) { setError('Skill name is required'); return; }
        setLoading(true);
        setError('');
        try {
            await api.put(`/api/users/skills/${type}`, {
                name: skillName.trim(),
                level,
                description: description.trim(),
            });
            toast.success(`"${skillName.trim()}" added to your ${type} list!`);
            onSuccess();
            onClose();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to add skill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
                    {type === 'teach' ? '🎓 Add Skill to Teach' : '📚 Add Skill to Learn'}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                    Start typing to see suggestions
                </p>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="input-label">Skill Name</label>
                        <SkillAutocomplete
                            value={skillName}
                            onChange={setSkillName}
                            placeholder="e.g. Python, Guitar, UI/UX Design…"
                        />
                        {error && <p className="input-error">{error}</p>}
                    </div>

                    <div>
                        <label className="input-label">Proficiency Level</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => setLevel(l)}
                                    style={{
                                        flex: 1, padding: '0.5rem 0', borderRadius: 8, cursor: 'pointer',
                                        fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                                        border: level === l ? 'none' : '1px solid var(--color-border)',
                                        background: level === l
                                            ? (l === 'Beginner' ? 'rgba(16,185,129,0.25)' : l === 'Intermediate' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)')
                                            : 'transparent',
                                        color: level === l
                                            ? (l === 'Beginner' ? '#34d399' : l === 'Intermediate' ? '#fbbf24' : '#f87171')
                                            : 'var(--color-text-muted)',
                                    }}
                                >{l}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Description <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
                        <textarea
                            className="input-field"
                            placeholder="Brief note about your experience…"
                            rows={2}
                            style={{ resize: 'vertical' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? 'Adding…' : 'Add Skill'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Skill Card ─────────────────────────────────────────────────────────────
const SkillCard = ({ skill, type, onDelete }) => {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/users/skills/${type}/${skill._id}`);
            toast.success('Skill removed');
            onDelete();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to remove');
        } finally {
            setDeleting(false);
        }
    };
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '0.875rem 1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{skill.name}</p>
                    <span className={`badge ${levelColors[skill.level]}`}>{skill.level}</span>
                </div>
                {skill.description && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{skill.description}</p>
                )}
            </div>
            <button
                onClick={handleDelete}
                disabled={deleting}
                title="Remove skill"
                style={{
                    background: 'none', border: 'none', color: deleting ? '#6b7280' : '#f87171',
                    cursor: deleting ? 'default' : 'pointer',
                    fontSize: '1rem', padding: '0.25rem', flexShrink: 0, marginLeft: '0.5rem',
                    transition: 'color 0.2s',
                }}
            >🗑</button>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const Skills = () => {
    const qc = useQueryClient();
    const [modal, setModal] = useState(null); // 'teach' | 'learn' | null

    const { data, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/api/auth/me').then((r) => r.data),
    });

    const refresh = () => qc.invalidateQueries({ queryKey: ['me'] });
    const user = data?.user;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">My Skills</h1>
                <p className="page-subtitle">Manage the skills you can teach and the skills you want to learn</p>
            </div>

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {[
                        { type: 'teach', title: '🎓 Skills I Can Teach', list: user?.skillsTeach || [], color: '#6366f1' },
                        { type: 'learn', title: '📚 Skills I Want to Learn', list: user?.skillsLearn || [], color: '#8b5cf6' },
                    ].map(({ type, title, list, color }) => (
                        <div key={type} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h2 style={{ fontWeight: 700, fontSize: '1rem', color }}>{title}</h2>
                                <button
                                    className="btn-primary"
                                    onClick={() => setModal(type)}
                                    style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                                >
                                    + Add
                                </button>
                            </div>

                            {list.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type === 'teach' ? '🎓' : '📚'}</p>
                                    <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>No skills added yet</p>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setModal(type)}
                                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                    >
                                        Add your first skill
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {list.map((s) => (
                                        <SkillCard key={s._id} skill={s} type={type} onDelete={refresh} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <AddSkillModal
                    type={modal}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}
        </div>
    );
};

export default Skills;
