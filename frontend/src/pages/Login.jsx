import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Brain, Mail, Lock, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-base)',
        }}>
            <div className="bg-mesh" />
            <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 24 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(99,102,241,0.3)',
                    }}>
                        <Brain size={30} color="white" />
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 800 }}>SMADS</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                        Social Media Addiction Detection System
                    </p>
                </div>

                {/* Form */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
                        Sign In
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>
                        </div>

                        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: 8 }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={16} />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}>
                                Create one
                            </Link>
                        </span>
                    </div>

                    {/* Demo credentials */}
                    <div style={{
                        marginTop: 16, padding: 12, borderRadius: 8,
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                        textAlign: 'center',
                    }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Demo: <strong>demo@smads.com</strong> / <strong>Demo@1234</strong>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
