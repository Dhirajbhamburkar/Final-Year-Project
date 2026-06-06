import { useNavigate } from 'react-router-dom';
import { useScreenTime } from '../../context/ScreenTimeContext';
import { Clock, ExternalLink } from 'lucide-react';

const PLATFORM_CONFIG = {
    Instaworld: {
        emoji: '📸',
        path: '/instaworld',
        gradient: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
        solidColor: '#e6683c',
        bgColor: 'rgba(230,104,60,0.12)',
        borderColor: 'rgba(230,104,60,0.25)',
    },
    Faceworld: {
        emoji: '🌐',
        path: '/faceworld',
        gradient: 'linear-gradient(135deg, #1877f2, #42a5f5)',
        solidColor: '#1877f2',
        bgColor: 'rgba(24,119,242,0.12)',
        borderColor: 'rgba(24,119,242,0.25)',
    },
};

function ScreenTimeBadge({ platform }) {
    const navigate = useNavigate();
    const { getFormattedTime, platformTimes, DEFAULT_DAILY_LIMIT_SECONDS } = useScreenTime();
    const config = PLATFORM_CONFIG[platform];
    const seconds = platformTimes[platform] || 0;
    const pct = Math.min((seconds / DEFAULT_DAILY_LIMIT_SECONDS) * 100, 100);
    const barColor = pct >= 100 ? '#ef4444' : pct >= 66 ? '#f59e0b' : '#10b981';

    return (
        <div
            onClick={() => navigate(config.path)}
            style={{
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                borderRadius: 10, padding: '10px 12px',
                cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = config.solidColor; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = config.borderColor; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{config.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{platform}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>
                        {getFormattedTime(platform)}
                    </span>
                    <ExternalLink size={11} color="var(--text-muted)" />
                </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 2,
                    background: barColor, transition: 'width 1s linear',
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Today</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Limit: 30m</span>
            </div>
        </div>
    );
}

export default function ScreenTimeWidget() {
    return (
        <div style={{
            padding: '12px',
            borderTop: '1px solid var(--border-subtle)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Clock size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Screen Time Today
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ScreenTimeBadge platform="Instaworld" />
                <ScreenTimeBadge platform="Faceworld" />
            </div>
        </div>
    );
}
