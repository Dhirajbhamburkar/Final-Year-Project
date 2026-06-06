import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Brain, Mail, Lock, User, Hash, UserPlus, Loader2 } from 'lucide-react';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '', email: '', password: '', full_name: '', age: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...form, age: form.age ? parseInt(form.age) : null };
            await register(data);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed');
        }
        setLoading(false);
    };

    const fields = [
        { key: 'full_name', label: 'Full Name', type: 'text', icon: User, placeholder: 'John Doe' },
        { key: 'username', label: 'Username', type: 'text', icon: Hash, placeholder: 'john_doe' },
        { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'john@example.com' },
        { key: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: '8+ characters' },
        { key: 'age', label: 'Age (optional)', type: 'number', icon: User, placeholder: '22' },
    ];

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-base)',
        }}>
            <div className="bg-mesh" />
            <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
                        Create your Digital Wellbeing account
                    </p>
                </div>

                <div className="glass-card" style={{ padding: 28 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
                        Create Account
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {fields.map(({ key, label, type, icon: Icon, placeholder }) => (
                            <div key={key}>
                                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    {label}
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type={type}
                                        className="input-field"
                                        placeholder={placeholder}
                                        value={form[key]}
                                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                                        required={key !== 'age'}
                                        minLength={key === 'password' ? 8 : undefined}
                                        style={{ paddingLeft: 40 }}
                                    />
                                </div>
                            </div>
                        ))}

                        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: 8 }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={16} />}
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}>
                                Sign in
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
