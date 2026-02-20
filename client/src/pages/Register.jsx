import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const Register = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        try {
            const res = await api.post('/api/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
            });
            login(res.data.user, res.data.token);
            toast.success(`Welcome to SkillSwap, ${res.data.user.name}! 🎉`);
            navigate('/skills');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 64px)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 440, padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚀</div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.4rem' }}>Create Your Account</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Join thousands of skill exchangers
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                        <label className="input-label">Full Name</label>
                        <input id="reg-name" type="text" className="input-field" placeholder="Jane Doe" {...register('name')} />
                        {errors.name && <p className="input-error">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="input-label">Email Address</label>
                        <input id="reg-email" type="email" className="input-field" placeholder="you@example.com" {...register('email')} />
                        {errors.email && <p className="input-error">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="input-label">Password</label>
                        <input id="reg-password" type="password" className="input-field" placeholder="Min. 6 characters" {...register('password')} />
                        {errors.password && <p className="input-error">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="input-label">Confirm Password</label>
                        <input id="reg-confirm" type="password" className="input-field" placeholder="Repeat password" {...register('confirmPassword')} />
                        {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        id="reg-submit"
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}
                    >
                        {isSubmitting ? 'Creating account...' : 'Create Account →'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
