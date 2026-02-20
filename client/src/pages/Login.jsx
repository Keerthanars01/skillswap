import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        try {
            const res = await api.post('/api/auth/login', data);
            login(res.data.user, res.data.token);
            toast.success(`Welcome back, ${res.data.user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 64px)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.4rem' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Sign in to your SkillSwap account
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="input-label">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            {...register('email')}
                        />
                        {errors.email && <p className="input-error">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="input-label">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            {...register('password')}
                        />
                        {errors.password && <p className="input-error">{errors.password.message}</p>}
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Join free
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
