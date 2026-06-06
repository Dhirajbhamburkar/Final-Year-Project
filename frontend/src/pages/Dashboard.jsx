import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usageAPI, alertsAPI, analyticsAPI } from '../services/api';
import { useScreenTime } from '../context/ScreenTimeContext';
import {
    Clock, Zap, Activity, TrendingUp, TrendingDown,
    Smartphone, AlertTriangle, Heart, Eye, Radio
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const RISK_COLORS = { normal: '#10b981', at_risk: '#f59e0b', addicted: '#ef4444' };
const PIE_COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

export default function Dashboard() {
    const { user, refreshProfile } = useAuth();
    const {
        platformTimes,
        activePlatform,
        getFormattedTime,
        totalTodayMinutes,
        DEFAULT_DAILY_LIMIT_SECONDS,
        SOCIAL_ROUTES,
        dismissedAlertsLog,
    } = useScreenTime();

    const [daily, setDaily] = useState(null);
    const [weekly, setWeekly] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [alerts, setAlerts] = useState({ total_unread: 0 });
    const [recovery, setRecovery] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [dailyRes, weeklyRes, heatmapRes, alertsRes, recoveryRes] = await Promise.allSettled([
                usageAPI.getDailySummary(),
                usageAPI.getWeeklyTrends(4),
                usageAPI.getHeatmap(30),
                alertsAPI.getAlerts(true),
                analyticsAPI.getRecovery(),
            ]);
            if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value.data);
            if (weeklyRes.status === 'fulfilled') setWeekly(weeklyRes.value.data);
            if (heatmapRes.status === 'fulfilled') setHeatmap(heatmapRes.value.data);
            if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data);
            if (recoveryRes.status === 'fulfilled') setRecovery(recoveryRes.value.data);
            refreshProfile();
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [refreshProfile]);

    // Initial load + poll every 30 s so dashboard reflects new sessions automatically
    useEffect(() => {
        loadData();
        const poll = setInterval(loadData, 30_000);
        return () => clearInterval(poll);
    }, [loadData]);

    const addictionIndex = daily?.addiction_index ?? user?.current_addiction_index ?? 0;
    const riskLevel = daily?.risk_level ?? user?.current_risk_level ?? 'normal';
    const screenTime = daily?.total_screen_time_minutes ?? 0;
    const sessions = daily?.total_sessions ?? 0;

    const formatTime = (mins) => {
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // Platform pie data
    const platformData = daily?.platforms_breakdown
        ? Object.entries(daily.platforms_breakdown).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1), value: Math.round(value)
        }))
        : [];

    // Heatmap grid
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getHeatmapIntensity = (day, hour) => {
        const point = heatmap.find(h => h.day_of_week === day && h.hour === hour);
        return point?.intensity || 0;
    };

    const getHeatmapColor = (intensity) => {
        if (intensity === 0) return 'var(--bg-elevated)';
        if (intensity < 0.25) return 'rgba(99, 102, 241, 0.2)';
        if (intensity < 0.5) return 'rgba(99, 102, 241, 0.4)';
        if (intensity < 0.75) return 'rgba(139, 92, 246, 0.6)';
        return 'rgba(239, 68, 68, 0.7)';
    };

    // Dopamine tracker data (from factors)
    const dopamineData = daily?.factors
        ? Object.entries(daily.factors).map(([key, val]) => ({
            factor: key.charAt(0).toUpperCase() + key.slice(1),
            score: val,
            fullMark: 100,
        }))
        : [];

    if (loading) {
        return (
            <div className="stagger-children" style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: i < 4 ? 120 : 250 }} />
                ))}
            </div>
        );
    }

    // Combine DB screen time with live context minutes for best estimate
    const liveMinutes = Math.max(screenTime, totalTodayMinutes);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                            Digital Wellness <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                            Monitor your social media habits and track your digital wellbeing journey.
                        </p>
                    </div>
                    {activePlatform && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 20,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            animation: 'pulse 2s infinite',
                        }}>
                            <Radio size={14} color="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                                Live Session: {activePlatform}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Live Screen Time Panel ── */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Radio size={16} color="#ef4444" />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Live Screen Time</span>
                    <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600,
                    }}>REAL-TIME</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Updates live across all tabs
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    {Object.entries(SOCIAL_ROUTES).map(([route, platform]) => {
                        const secs = platformTimes[platform] || 0;
                        const limitS = DEFAULT_DAILY_LIMIT_SECONDS;
                        const pct = Math.min((secs / limitS) * 100, 100);
                        const barClr = pct >= 100 ? '#ef4444' : pct >= 66 ? '#f59e0b' : '#10b981';
                        const isActive = activePlatform === platform;
                        return (
                            <div key={platform} style={{
                                padding: '14px 16px', borderRadius: 12,
                                background: isActive ? `${barClr}10` : 'var(--bg-elevated)',
                                border: `1px solid ${isActive ? barClr + '50' : 'var(--border-subtle)'}`,
                                transition: 'all 0.3s',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 20 }}>{platform === 'Instaworld' ? '📸' : '👥'}</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{platform}</div>
                                            {isActive && (
                                                <div style={{ fontSize: 10, color: barClr, fontWeight: 600 }}>● LIVE</div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: barClr, fontVariantNumeric: 'tabular-nums' }}>
                                        {getFormattedTime(platform)}
                                    </div>
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${pct}%`, height: '100%',
                                        background: `linear-gradient(90deg, ${barClr}99, ${barClr})`,
                                        borderRadius: 3,
                                        transition: 'width 1s linear',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pct.toFixed(0)}% of daily limit</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                        Limit: {Math.floor(limitS / 60)}m
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {/* Total today */}
                    <div style={{
                        padding: '14px 16px', borderRadius: 12,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Clock size={16} color="var(--primary-400)" />
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Total Today</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-400)', fontVariantNumeric: 'tabular-nums' }}>
                            {(() => {
                                const totalS = Object.values(platformTimes).reduce((a, b) => a + b, 0);
                                const h = Math.floor(totalS / 3600);
                                const m = Math.floor((totalS % 3600) / 60);
                                const s = totalS % 60;
                                return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
                            })()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Tracked across all platforms</div>
                    </div>
                </div>
            </div>

            {/* ── Dismissed Alerts Log ── */}
            {dismissedAlertsLog.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <AlertTriangle size={15} color="var(--warning)" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Addressed Alerts
                        </span>
                        <span style={{
                            fontSize: 11, padding: '1px 8px', borderRadius: 10,
                            background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700,
                        }}>{dismissedAlertsLog.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                        {dismissedAlertsLog.slice().reverse().map((alert, i) => {
                            const isLimit = alert.type === 'limit';
                            const isInstaworld = alert.platform === 'Instaworld';
                            const accentColor = isLimit ? '#ef4444' : '#f59e0b';
                            const glowColor = isLimit ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.15)';
                            const borderColor = isLimit ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)';
                            const bgGrad = isLimit
                                ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04))'
                                : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))';
                            const platformAccent = isInstaworld ? '#e6683c' : '#1877f2';
                            const platformBg = isInstaworld ? 'rgba(230,104,60,0.15)' : 'rgba(24,119,242,0.15)';
                            const platformBorder = isInstaworld ? 'rgba(230,104,60,0.3)' : 'rgba(24,119,242,0.3)';

                            const s = alert.seconds;
                            const h = Math.floor(s / 3600);
                            const m = Math.floor((s % 3600) / 60);
                            const sec = s % 60;
                            const timeOnPlatform = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
                            const limitSec = DEFAULT_DAILY_LIMIT_SECONDS;
                            const progressPct = Math.min((s / limitSec) * 100, 100);

                            const dh = alert.dismissedAt.getHours();
                            const dm = alert.dismissedAt.getMinutes();
                            const timeStr = `${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}`;

                            return (
                                <div key={i} style={{
                                    borderRadius: 18,
                                    padding: '22px 24px',
                                    background: bgGrad,
                                    border: `1px solid ${borderColor}`,
                                    boxShadow: `0 0 28px ${glowColor}, 0 8px 32px rgba(0,0,0,0.25)`,
                                    textAlign: 'center',
                                    position: 'relative',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 0 36px ${glowColor}, 0 12px 40px rgba(0,0,0,0.3)`; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 28px ${glowColor}, 0 8px 32px rgba(0,0,0,0.25)`; }}
                                >
                                    {/* Dismissed badge top-right */}
                                    <div style={{
                                        position: 'absolute', top: 12, right: 12,
                                        fontSize: 10, padding: '2px 8px', borderRadius: 8,
                                        background: 'rgba(16,185,129,0.12)',
                                        color: '#10b981', fontWeight: 700, letterSpacing: '0.5px',
                                    }}>✓ SEEN</div>

                                    {/* Warning icon */}
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%',
                                        background: isLimit ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                        border: `2px solid ${accentColor}55`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 12px',
                                    }}>
                                        <AlertTriangle size={22} color={accentColor} style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }} />
                                    </div>

                                    {/* Platform badge */}
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '3px 12px', borderRadius: 20, marginBottom: 10,
                                        background: platformBg, border: `1px solid ${platformBorder}`,
                                    }}>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: platformAccent, display: 'inline-block', flexShrink: 0,
                                        }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: platformAccent }}>{alert.platform}</span>
                                    </div>

                                    {/* Heading */}
                                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                                        {isLimit ? '⏰ Daily Limit Reached' : '⚠️ Screen Time Warning'}
                                    </div>

                                    {/* Message */}
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                                        {isLimit
                                            ? `You'd spent ${timeOnPlatform} on ${alert.platform} — daily limit reached.`
                                            : `You were approaching your 30-minute daily limit on ${alert.platform}.`
                                        }
                                    </p>

                                    {/* Progress bar */}
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <Clock size={10} /> Time spent
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: accentColor }}>
                                                {timeOnPlatform} / 30m
                                            </span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${progressPct}%`, borderRadius: 3,
                                                background: isLimit
                                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                                    : 'linear-gradient(90deg, #10b981, #f59e0b)',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        Addressed at <strong style={{ color: 'var(--text-secondary)' }}>{timeStr}</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── KPI Cards ── */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {/* Addiction Index */}
                <div className="glass-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${RISK_COLORS[riskLevel]}22, transparent)`,
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Activity size={16} color={RISK_COLORS[riskLevel]} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Addiction Index</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: RISK_COLORS[riskLevel] }}>
                        {addictionIndex.toFixed(1)}
                    </div>
                    <span className={`badge badge-${riskLevel.replace('_', '-')}`} style={{ marginTop: 8 }}>
                        {riskLevel.replace('_', ' ')}
                    </span>
                </div>

                {/* Screen Time — shows best of DB value vs live context */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Clock size={16} color="var(--primary-400)" />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Screen Time Today</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatTime(liveMinutes)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Daily limit: {formatTime(user?.preferences?.daily_limit_minutes || 240)}
                    </span>
                </div>

                {/* Sessions */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Smartphone size={16} color="var(--accent-400)" />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Sessions Today</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {sessions}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        App switches: {daily?.total_app_switches ?? 0}
                    </span>
                </div>

                {/* Unread Alerts */}
                <div className={`glass-card ${alerts.total_unread > 0 ? 'pulse-alert' : ''}`} style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <AlertTriangle size={16} color="var(--warning)" />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Active Alerts</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: alerts.total_unread > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {alerts.total_unread || 0}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {alerts.critical_count || 0} critical
                    </span>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Weekly Trends Chart */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                        <TrendingUp size={18} style={{ display: 'inline', marginRight: 8 }} />
                        Weekly Screen Time Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={weekly}>
                            <defs>
                                <linearGradient id="colorScreenTime" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis
                                dataKey="week_start"
                                tickFormatter={(v) => v?.slice(5)}
                                stroke="var(--text-muted)"
                                fontSize={11}
                            />
                            <YAxis stroke="var(--text-muted)" fontSize={11} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-medium)',
                                    borderRadius: 10,
                                    color: 'var(--text-primary)',
                                    fontSize: 12,
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="avg_daily_screen_time_minutes"
                                stroke="#6366f1"
                                fill="url(#colorScreenTime)"
                                strokeWidth={2}
                                name="Avg Daily (min)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Platform Breakdown */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                        <Eye size={18} style={{ display: 'inline', marginRight: 8 }} />
                        Platform Usage
                    </h3>
                    {platformData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={platformData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, value }) => `${name} ${value}m`}
                                    labelLine={{ stroke: 'var(--text-muted)' }}
                                >
                                    {platformData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-medium)',
                                        borderRadius: 10,
                                        fontSize: 12,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No usage data for today
                        </div>
                    )}
                </div>
            </div>

            {/* ── Dopamine Tracker & Usage Heatmap ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Dopamine Tracker (Radar Chart) */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                        <Zap size={18} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
                        Dopamine Trigger Tracker
                    </h3>
                    {dopamineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={dopamineData}>
                                <PolarGrid stroke="rgba(99,102,241,0.15)" />
                                <PolarAngleAxis
                                    dataKey="factor"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                />
                                <Radar
                                    name="Score"
                                    dataKey="score"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-medium)',
                                        borderRadius: 10,
                                        fontSize: 12,
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Submit usage data to see your dopamine trigger profile
                        </div>
                    )}
                </div>

                {/* Usage Heatmap */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                        <Activity size={18} style={{ display: 'inline', marginRight: 8, color: '#06b6d4' }} />
                        Usage Heatmap (30 Days)
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: 2 }}>
                            {/* Header row - hours */}
                            <div />
                            {hours.map(h => (
                                <div key={h} style={{
                                    fontSize: 9, color: 'var(--text-muted)', textAlign: 'center',
                                    display: h % 3 === 0 ? 'block' : 'none',
                                }}>
                                    {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                                </div>
                            ))}
                            {/* Data rows */}
                            {days.map((day, dayIdx) => (
                                <>
                                    <div key={`label-${dayIdx}`} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                        {day}
                                    </div>
                                    {hours.map(hour => {
                                        const intensity = getHeatmapIntensity(dayIdx, hour);
                                        return (
                                            <div
                                                key={`${dayIdx}-${hour}`}
                                                title={`${day} ${hour}:00 — Intensity: ${(intensity * 100).toFixed(0)}%`}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    borderRadius: 3,
                                                    background: getHeatmapColor(intensity),
                                                    transition: 'all var(--transition-fast)',
                                                    cursor: 'pointer',
                                                    minWidth: 12,
                                                }}
                                            />
                                        );
                                    })}
                                </>
                            ))}
                        </div>
                        {/* Legend */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
                            {[0, 0.25, 0.5, 0.75, 1].map(v => (
                                <div key={v} style={{
                                    width: 14, height: 14, borderRadius: 3,
                                    background: getHeatmapColor(v),
                                    border: '1px solid var(--border-subtle)',
                                }} />
                            ))}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recovery & Recommendations ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Recovery Score */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                        <Heart size={18} style={{ display: 'inline', marginRight: 8, color: '#ec4899' }} />
                        Digital Recovery Progress
                    </h3>
                    {recovery ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 140, height: 140, borderRadius: '50%', margin: '0 auto 16px',
                                background: `conic-gradient(var(--primary-500) ${recovery.recovery_score * 3.6}deg, var(--bg-elevated) 0deg)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: 110, height: 110, borderRadius: '50%',
                                    background: 'var(--bg-surface)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column',
                                }}>
                                    <span style={{ fontSize: 32, fontWeight: 800 }}>{recovery.recovery_score}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</span>
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{recovery.message}</p>
                            <span className={`badge badge-${recovery.trend === 'improving' ? 'normal' : recovery.trend === 'worsening' ? 'addicted' : 'at-risk'}`} style={{ marginTop: 12 }}>
                                {recovery.trend === 'improving' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                {' '}{recovery.trend}
                            </span>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                            Start tracking to see your recovery progress
                        </p>
                    )}
                </div>

                {/* Recommendations */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                        💡 Personalized Recommendations
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(daily?.recommendations || ['✅ Start tracking your usage to get personalized recommendations.']).map((rec, i) => (
                            <div key={i} style={{
                                padding: '12px 14px',
                                background: 'var(--bg-elevated)',
                                borderRadius: 10,
                                border: '1px solid var(--border-subtle)',
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5,
                            }}>
                                {rec}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
