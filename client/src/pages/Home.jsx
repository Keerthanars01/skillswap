import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const stats = [
    { value: '2,400+', label: 'Active Users' },
    { value: '8,100+', label: 'Skills Listed' },
    { value: '3,200+', label: 'Sessions Completed' },
    { value: '94%', label: 'Satisfaction Rate' },
];

const steps = [
    {
        icon: '📝',
        title: 'List Your Skills',
        desc: 'Add what you can teach and what you want to learn. Be specific — the more detail, the better your matches.',
    },
    {
        icon: '🤝',
        title: 'Get Matched',
        desc: 'Our algorithm finds users with complementary skills. They teach what you want to learn, and vice versa.',
    },
    {
        icon: '🚀',
        title: 'Exchange & Grow',
        desc: 'Schedule sessions, complete exchanges, and build your reliability score. No money — just skills.',
    },
];

const featuredSkills = [
    'JavaScript', 'Python', 'Photoshop', 'Guitar', 'Spanish', 'React',
    'UI/UX Design', 'Data Science', 'Video Editing', 'Yoga', 'Excel', 'Photography',
];

const Home = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div>
            {/* ─── Hero ─────────────────────────────────────────────────────────── */}
            <section style={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '4rem 1.5rem',
                background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 70%)',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Background orbs */}
                <div style={{
                    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                    top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: 760, position: 'relative', zIndex: 1 }} className="fade-in-up">
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 999, padding: '0.4rem 1rem', marginBottom: '1.5rem',
                        fontSize: '0.82rem', color: '#a5b4fc'
                    }}>
                        ⚡ The future of skill sharing is here
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.25rem' }}>
                        Trade Skills,{' '}
                        <span className="gradient-text">Not Money</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--color-text-muted)',
                        maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7
                    }}>
                        SkillSwap connects people who want to learn with people who want to teach.
                        You share what you know, you gain what you need — completely free.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {isAuthenticated ? (
                            <Link to="/dashboard">
                                <button className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                    Go to Dashboard →
                                </button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register">
                                    <button className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                        Join Free — It's Easy
                                    </button>
                                </Link>
                                <Link to="/login">
                                    <button className="btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                        Sign In
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Stats Bar ────────────────────────────────────────────────────── */}
            <section style={{
                background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)', padding: '2rem 1.5rem'
            }}>
                <div style={{
                    maxWidth: 1000, margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem',
                    textAlign: 'center'
                }}>
                    {stats.map(({ value, label }) => (
                        <div key={label}>
                            <p style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text">{value}</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── How It Works ─────────────────────────────────────────────────── */}
            <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>How SkillSwap Works</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                        Three simple steps to start exchanging skills with people around you
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                        {steps.map((step, i) => (
                            <div key={i} className="glass-card" style={{ padding: '2rem', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 800, color: 'white'
                                }}>{i + 1}</div>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>{step.icon}</div>
                                <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.1rem' }}>{step.title}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Featured Skills ──────────────────────────────────────────────── */}
            <section style={{ padding: '3rem 1.5rem 5rem', textAlign: 'center' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Popular Skills Being Exchanged</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        From tech to arts — every skill has value here
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                        {featuredSkills.map((skill) => (
                            <span key={skill} style={{
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                borderRadius: 999, padding: '0.45rem 1.1rem',
                                fontSize: '0.875rem', color: '#a5b4fc', fontWeight: 500,
                                transition: 'all 0.2s', cursor: 'default'
                            }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(99,102,241,0.2)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(99,102,241,0.1)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >{skill}</span>
                        ))}
                    </div>

                    {!isAuthenticated && (
                        <div style={{ marginTop: '3rem' }}>
                            <Link to="/register">
                                <button className="btn-primary" style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}>
                                    Start Swapping Skills Today →
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
