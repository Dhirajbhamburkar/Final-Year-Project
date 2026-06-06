import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ScreenTimeWidget from './ScreenTimeWidget';
import {
    LayoutDashboard, BarChart3, Bell, Shield, ClipboardCheck,
    LogOut, Brain, User, Instagram, Facebook
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics & ML', icon: BarChart3 },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/interventions', label: 'Interventions', icon: Shield },
    { path: '/assessment', label: 'BSMAS Assessment', icon: ClipboardCheck },
];

const socialItems = [
    { path: '/instaworld', label: 'Instaworld', emoji: '📸', accent: 'linear-gradient(135deg,#f09433,#bc1888)' },
    { path: '/faceworld', label: 'Faceworld', emoji: '🌐', accent: '#1877f2' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const riskColor = {
        normal: 'var(--risk-normal)',
        at_risk: 'var(--risk-at-risk)',
        addicted: 'var(--risk-addicted)',
    };

    return (
        <aside style={{
            width: 260,
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
        }}>
            {/* Logo */}
            <div style={{
                padding: '24px 20px 16px',
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Brain size={20} color="white" />
                    </div>
                    <div>
                        <div className="gradient-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
                            SMADS
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
                            ADDICTION DETECTION
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 14px',
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all var(--transition-fast)',
                            })}
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Social Platforms section */}
                <div style={{ padding: '0 12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', padding: '10px 2px 6px' }}>
                        Social Platforms
                    </div>
                    {socialItems.map(({ path, label, emoji, accent }) => (
                        <NavLink
                            key={path}
                            to={path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '9px 12px',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all var(--transition-fast)',
                                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                marginBottom: 2,
                            })}
                        >
                            <span style={{ fontSize: 18 }}>{emoji}</span>
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* User Profile Card */}
                <ScreenTimeWidget />

                {user && (
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid var(--border-subtle)',
                    }}>
                        <div style={{
                            padding: '12px',
                            borderRadius: 12,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <User size={16} color="white" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {user.full_name || user.username}
                                    </div>
                                    <div style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: riskColor[user.current_risk_level] || 'var(--text-muted)',
                                        textTransform: 'uppercase', letterSpacing: 0.5,
                                    }}>
                                        {(user.current_risk_level || 'normal').replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    padding: '8px',
                                    borderRadius: 8,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>{/* end scrollable content */}
        </aside>
    );
}
