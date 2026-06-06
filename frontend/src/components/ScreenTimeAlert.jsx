import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreenTime } from '../context/ScreenTimeContext';
import { AlertTriangle, XCircle, Clock, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ScreenTimeAlert() {
    const { activeAlert, dismissAlert, getFormattedTime, DEFAULT_DAILY_LIMIT_SECONDS, ALERT_THRESHOLD_SECONDS } = useScreenTime();
    const navigate = useNavigate();
    const overlayRef = useRef(null);

    // Trap focus / escape key
    useEffect(() => {
        if (!activeAlert) return;
        const handler = (e) => {
            if (e.key === 'Escape') dismissAlert(activeAlert.platform, activeAlert.type);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeAlert, dismissAlert]);

    if (!activeAlert) return null;

    const { platform, seconds, type } = activeAlert;
    const isLimit = type === 'limit';
    const formattedTime = getFormattedTime(platform);
    const limitSec = DEFAULT_DAILY_LIMIT_SECONDS;
    const progressPct = Math.min((seconds / limitSec) * 100, 100);

    const isInstaworld = platform === 'Instaworld';
    const accentColor = isInstaworld
        ? 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
        : '#1877f2';
    const accentSolid = isInstaworld ? '#e6683c' : '#1877f2';

    const handleGoBack = () => {
        dismissAlert(platform, type);
        navigate('/');
    };

    const handleDismiss = () => {
        dismissAlert(platform, type);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                ref={overlayRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeInOverlay 0.3s ease',
                }}
            >
                {/* Modal */}
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: `1px solid ${isLimit ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                        borderRadius: 24,
                        padding: '36px 40px',
                        maxWidth: 480,
                        width: '90%',
                        boxShadow: isLimit
                            ? '0 0 60px rgba(239,68,68,0.2), 0 24px 80px rgba(0,0,0,0.5)'
                            : '0 0 60px rgba(245,158,11,0.15), 0 24px 80px rgba(0,0,0,0.5)',
                        animation: 'slideUpModal 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                        textAlign: 'center',
                        position: 'relative',
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        style={{
                            position: 'absolute', top: 16, right: 16,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: 4,
                            borderRadius: 6, transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <XCircle size={20} />
                    </button>

                    {/* Icon */}
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: isLimit ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        border: isLimit ? '2px solid rgba(239,68,68,0.4)' : '2px solid rgba(245,158,11,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        animation: isLimit ? 'pulse-glow 2s infinite' : 'none',
                    }}>
                        <AlertTriangle
                            size={32}
                            color={isLimit ? '#ef4444' : '#f59e0b'}
                            style={{ filter: `drop-shadow(0 0 8px ${isLimit ? '#ef4444' : '#f59e0b'})` }}
                        />
                    </div>

                    {/* Platform badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '4px 14px', borderRadius: 20, marginBottom: 16,
                        background: isInstaworld
                            ? 'rgba(230,104,60,0.15)' : 'rgba(24,119,242,0.15)',
                        border: `1px solid ${isInstaworld ? 'rgba(230,104,60,0.3)' : 'rgba(24,119,242,0.3)'}`,
                    }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: accentColor, flexShrink: 0,
                            display: 'inline-block',
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: accentSolid }}>{platform}</span>
                    </div>

                    {/* Heading */}
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {isLimit ? '⏰ Daily Limit Reached!' : '⚠️ Screen Time Warning'}
                    </h2>

                    {/* Message */}
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                        {isLimit
                            ? `You've spent ${formattedTime} on ${platform} today — your daily limit of 30 minutes has been reached. Taking a break is good for your wellbeing!`
                            : `You've been on ${platform} for ${formattedTime} today. You're approaching your 30-minute daily limit.`
                        }
                    </p>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> Time spent today
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isLimit ? '#ef4444' : '#f59e0b' }}>
                                {formattedTime} / 30m
                            </span>
                        </div>
                        <div style={{
                            height: 8, borderRadius: 4,
                            background: 'var(--bg-surface)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                borderRadius: 4,
                                background: isLimit
                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                    : 'linear-gradient(90deg, #10b981, #f59e0b)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleGoBack}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '11px 24px',
                                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                                color: 'white', border: 'none', borderRadius: 12,
                                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <ArrowLeft size={16} /> Go to Dashboard
                        </button>
                        <button
                            onClick={handleDismiss}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '11px 24px',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: 12, fontSize: 14, fontWeight: 500,
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                            <RefreshCw size={14} /> Keep Browsing
                        </button>
                    </div>

                    {/* Footer note */}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
                        This is tracked by SMADS for your wellbeing 🧠
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeInOverlay {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpModal {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
