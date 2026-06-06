import { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, AlertTriangle, Info, AlertOctagon, Clock } from 'lucide-react';

const SEVERITY_CONFIG = {
    critical: { icon: AlertOctagon, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
};

export default function Alerts() {
    const [data, setData] = useState({ alerts: [], total_unread: 0, critical_count: 0, warning_count: 0 });
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAlerts(); }, [filter]);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const res = await alertsAPI.getAlerts(filter === 'unread');
            setData(res.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const markRead = async (id) => {
        await alertsAPI.markRead(id);
        loadAlerts();
        toast.success('Alert marked as read');
    };

    const markAllRead = async () => {
        await alertsAPI.markAllRead();
        loadAlerts();
        toast.success('All alerts marked as read');
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                        <Bell size={28} style={{ display: 'inline', marginRight: 10 }} />
                        Alert <span className="gradient-text">Center</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Real-time warnings when your usage exceeds safety thresholds.
                    </p>
                </div>
                {data.total_unread > 0 && (
                    <button className="btn-secondary" onClick={markAllRead}>
                        <CheckCheck size={16} /> Mark All Read ({data.total_unread})
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{data.critical_count || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Critical</div>
                </div>
                <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>{data.warning_count || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Warnings</div>
                </div>
                <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-400)' }}>{data.total_unread || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unread</div>
                </div>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'unread'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: '1px solid',
                            borderColor: filter === f ? 'var(--primary-500)' : 'var(--border-subtle)',
                            background: filter === f ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: filter === f ? 'var(--primary-400)' : 'var(--text-muted)',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)
                ) : data.alerts?.length > 0 ? (
                    data.alerts.map((alert) => {
                        const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
                        const Icon = config.icon;
                        return (
                            <div
                                key={alert.id}
                                className="glass-card"
                                style={{
                                    padding: '16px 20px',
                                    borderLeft: `4px solid ${config.color}`,
                                    opacity: alert.is_read ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 14,
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: config.bg, border: `1px solid ${config.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={18} color={config.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                                            <Clock size={12} />
                                            {timeAgo(alert.created_at)}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                                        {alert.message}
                                    </p>
                                </div>
                                {!alert.is_read && (
                                    <button
                                        onClick={() => markRead(alert.id)}
                                        style={{
                                            padding: '6px 12px', borderRadius: 8,
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                            color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                                            transition: 'all var(--transition-fast)',
                                        }}
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p>No alerts to show</p>
                    </div>
                )}
            </div>
        </div>
    );
}
