import { useState, useEffect } from 'react';
import { interventionsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Timer, CheckCircle2, Play, Loader2 } from 'lucide-react';

export default function Interventions() {
    const [suggestions, setSuggestions] = useState(null);
    const [history, setHistory] = useState([]);
    const [focusDuration, setFocusDuration] = useState(30);
    const [activeFocus, setActiveFocus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [sugRes, histRes] = await Promise.all([
                interventionsAPI.getSuggestions(),
                interventionsAPI.getHistory(),
            ]);
            setSuggestions(sugRes.data);
            setHistory(histRes.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const startFocus = async () => {
        try {
            const res = await interventionsAPI.startFocusMode(focusDuration);
            setActiveFocus(res.data);
            toast.success(`Focus Mode activated for ${focusDuration} minutes!`);
        } catch (err) {
            toast.error('Failed to start Focus Mode');
        }
    };

    const completeFocus = async () => {
        if (!activeFocus?.id) return;
        try {
            await interventionsAPI.completeFocusMode(activeFocus.id);
            setActiveFocus(null);
            toast.success('Focus session completed! 🎉');
            loadData();
        } catch {
            toast.error('Failed to complete');
        }
    };

    const riskBadgeColors = {
        normal: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
        at_risk: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
        addicted: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    };

    const riskStyle = riskBadgeColors[suggestions?.risk_level] || riskBadgeColors.normal;

    if (loading) {
        return (
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                    <Shield size={28} style={{ display: 'inline', marginRight: 10 }} />
                    Smart <span className="gradient-text">Interventions</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    Digital detox activities and Focus Mode to help you regain control.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Focus Mode */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                        <Timer size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--primary-400)' }} />
                        Focus Mode
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        {suggestions?.focus_mode?.message || 'Activate Focus Mode to block distractions.'}
                    </p>

                    {activeFocus ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                            <div style={{
                                width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
                                border: '3px solid var(--primary-500)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                animation: 'pulse-glow 2s infinite',
                            }}>
                                <Timer size={36} color="var(--primary-400)" />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-400)', marginBottom: 8 }}>
                                Focus Mode Active
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                Ends at: {activeFocus.ends_at?.slice(11, 16)}
                            </p>
                            <button className="btn-primary" onClick={completeFocus}>
                                <CheckCircle2 size={16} /> Complete Session
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                {[15, 30, 45, 60, 90].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setFocusDuration(d)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 8,
                                            background: focusDuration === d ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                                            border: `1px solid ${focusDuration === d ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                                            color: focusDuration === d ? 'var(--primary-400)' : 'var(--text-muted)',
                                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            transition: 'all var(--transition-fast)',
                                        }}
                                    >
                                        {d}m
                                    </button>
                                ))}
                            </div>
                            <button className="btn-primary" onClick={startFocus} style={{ width: '100%' }}>
                                <Play size={16} /> Start Focus Mode ({focusDuration} min)
                            </button>
                        </div>
                    )}
                </div>

                {/* Current Risk Status */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Current Risk Assessment</h3>
                    <div style={{
                        padding: 16, borderRadius: 12,
                        background: riskStyle.bg,
                        border: `1px solid ${riskStyle.border}`,
                        textAlign: 'center', marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: riskStyle.color }}>
                            {suggestions?.addiction_index?.toFixed(1) ?? '—'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: riskStyle.color, textTransform: 'uppercase' }}>
                            {(suggestions?.risk_level || 'unknown').replace('_', ' ')}
                        </div>
                    </div>
                    {suggestions?.focus_mode?.recommended && (
                        <div style={{
                            padding: 12, borderRadius: 8,
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            fontSize: 12, color: '#f59e0b', textAlign: 'center',
                        }}>
                            ⚡ Focus Mode is recommended for you right now
                        </div>
                    )}
                </div>

                {/* Detox Activities */}
                <div className="glass-card" style={{ padding: 24, gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                        🌿 Suggested Detox Activities
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                        {(suggestions?.activities || []).map((activity, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: 16, borderRadius: 12,
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    transition: 'all var(--transition-smooth)',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{activity.icon}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {activity.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                                    {activity.description}
                                </div>
                                <span style={{
                                    fontSize: 11, padding: '3px 10px', borderRadius: 12,
                                    background: 'rgba(99,102,241,0.1)', color: 'var(--primary-400)',
                                    fontWeight: 500,
                                }}>
                                    {activity.duration_min} min
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* History */}
                <div className="glass-card" style={{ padding: 24, gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📜 Intervention History</h3>
                    {history.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {history.map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 16px', borderRadius: 8,
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {item.completed ? <CheckCircle2 size={16} color="var(--success)" /> : <Timer size={16} color="var(--text-muted)" />}
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.type.replace('_', ' ')}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.duration_minutes} min</span>
                                        <span style={{ fontSize: 11, color: item.completed ? 'var(--success)' : 'var(--text-muted)' }}>
                                            {item.completed ? '✓ Completed' : 'Skipped'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
                            No intervention history yet. Start a Focus Mode session!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
