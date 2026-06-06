import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usageAPI } from '../services/api';

// ── Constants ──────────────────────────────────────────────────────────────
const SOCIAL_ROUTES = {
    '/instaworld': 'Instaworld',
    '/faceworld': 'Faceworld',
};

// Maps internal platform names → backend Platform enum values
const PLATFORM_API_MAP = {
    'Instaworld': 'instagram',
    'Faceworld': 'facebook',
};

const DEFAULT_DAILY_LIMIT_SECONDS = 60 * 30; // 30 minutes per platform
const ALERT_THRESHOLD_SECONDS = 60 * 20; // warn at 20 minutes
const PUSH_INTERVAL_MS = 30_000;  // push to backend every 30 s
const STORAGE_KEY = 'smads_screen_time';
const DISMISSED_KEY = 'smads_dismissed_alerts';
const DISMISSED_LOG_KEY = 'smads_dismissed_log';
const BROADCAST_CHANNEL_NAME = 'smads-screen-time';

// ── Helpers ────────────────────────────────────────────────────────────────
function getTodayKey() {
    // Always compute "today" in Indian Standard Time (UTC+5:30)
    const now = new Date();
    const istOffset = 5 * 60 + 30; // minutes
    const istMs = now.getTime() + (istOffset + now.getTimezoneOffset()) * 60_000;
    const ist = new Date(istMs);
    const y = ist.getFullYear();
    const m = String(ist.getMonth() + 1).padStart(2, '0');
    const d = String(ist.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`; // YYYY-MM-DD in IST
}

function loadStoredTimes() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed[getTodayKey()] || {};
    } catch {
        return {};
    }
}

function loadDismissedAlerts() {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Only keep today's dismissals
        return parsed[getTodayKey()] || {};
    } catch {
        return {};
    }
}

function saveDismissedAlerts(alerts) {
    try {
        const today = getTodayKey();
        const all = {};
        all[today] = alerts;
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
}

function loadDismissedLog() {
    try {
        const raw = localStorage.getItem(DISMISSED_LOG_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // Only keep today's log entries & rehydrate Date objects
        const todayLog = parsed[getTodayKey()] || [];
        return todayLog.map(entry => ({ ...entry, dismissedAt: new Date(entry.dismissedAt) }));
    } catch {
        return [];
    }
}

function saveDismissedLog(log) {
    try {
        const today = getTodayKey();
        const all = {};
        all[today] = log;
        localStorage.setItem(DISMISSED_LOG_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
}

function saveStoredTimes(times) {
    try {
        const today = getTodayKey();
        const raw = localStorage.getItem(STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : {};
        all[today] = times;
        // Keep only last 30 days
        const keys = Object.keys(all).sort().slice(-30);
        const pruned = {};
        keys.forEach(k => { pruned[k] = all[k]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch { /* ignore */ }
}

// ── Context ────────────────────────────────────────────────────────────────
const ScreenTimeContext = createContext(null);

export function ScreenTimeProvider({ children }) {
    const location = useLocation();

    // { Instaworld: 320, Faceworld: 110 }  — seconds spent today
    const [platformTimes, setPlatformTimes] = useState(loadStoredTimes);
    const [activeAlert, setActiveAlert] = useState(null);
    const [dismissedAlerts, setDismissedAlerts] = useState(loadDismissedAlerts);
    // Persistent log of every alert the user has dismissed (today)
    const [dismissedAlertsLog, setDismissedAlertsLog] = useState(loadDismissedLog);

    const intervalRef = useRef(null);
    const currentPlatformRef = useRef(null);
    const sessionStartRef = useRef(null);   // Date.now() when current session began
    const lastPushedRef = useRef({});      // { platform: seconds } last pushed to backend
    const platformTimesRef = useRef(platformTimes); // always-current mirror for async callbacks

    // BroadcastChannel for cross-tab synchronisation
    const channelRef = useRef(null);

    // Which platform is currently active in this tab?
    const activePlatform = SOCIAL_ROUTES[location.pathname] || null;

    // Keep ref in sync with state
    useEffect(() => {
        platformTimesRef.current = platformTimes;
    }, [platformTimes]);

    // ── BroadcastChannel setup ─────────────────────────────────────────────
    useEffect(() => {
        if (!window.BroadcastChannel) return;

        const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = ch;

        ch.onmessage = (e) => {
            if (e.data?.type !== 'SYNC_TIMES') return;
            // Merge: take the max of local vs received to avoid rolling back
            setPlatformTimes(prev => {
                const incoming = e.data.times || {};
                const merged = { ...prev };
                let changed = false;
                Object.entries(incoming).forEach(([platform, secs]) => {
                    if ((secs || 0) > (merged[platform] || 0)) {
                        merged[platform] = secs;
                        changed = true;
                    }
                });
                if (!changed) return prev;
                saveStoredTimes(merged);
                return merged;
            });
        };

        return () => {
            ch.close();
            channelRef.current = null;
        };
    }, []);

    // Broadcast updated times to other tabs
    const broadcastTimes = useCallback((times) => {
        channelRef.current?.postMessage({ type: 'SYNC_TIMES', times });
    }, []);

    // ── Tick every second ──────────────────────────────────────────────────
    useEffect(() => {
        currentPlatformRef.current = activePlatform;

        if (activePlatform) {
            // Record when this platform session started
            sessionStartRef.current = new Date();
        } else {
            sessionStartRef.current = null;
        }

        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            const platform = currentPlatformRef.current;
            if (!platform) return;

            setPlatformTimes(prev => {
                const updated = { ...prev, [platform]: (prev[platform] || 0) + 1 };
                saveStoredTimes(updated);
                broadcastTimes(updated);
                return updated;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [activePlatform, broadcastTimes]);

    // ── Push a session to the backend ──────────────────────────────────────
    const pushSession = useCallback(async (platform, sessionStart, sessionEnd) => {
        if (!platform || !sessionStart) return;
        const durationMs = sessionEnd - sessionStart;
        const durationMinutes = durationMs / 60_000;
        if (durationMinutes < 0.1) return; // ignore < 6 second blips

        const apiPlatform = PLATFORM_API_MAP[platform];
        if (!apiPlatform) return;

        try {
            await usageAPI.submitLog({
                platform: apiPlatform,
                session_duration_minutes: durationMinutes,
                session_start: sessionStart.toISOString(),
                session_end: sessionEnd.toISOString(),
                app_switches: 0,
                scroll_depth_percentage: Math.random() * 60 + 20, // realistic simulation
                interactions: {
                    likes: 0, comments: 0, shares: 0,
                    posts_viewed: Math.floor(durationMinutes * 3), // ~3 posts/min
                },
                device_type: 'web',
            });
        } catch (err) {
            console.warn('[SMADS] Usage push failed (will retry)', err?.message);
        }
    }, []);

    // ── Periodic 30-second push ────────────────────────────────────────────
    useEffect(() => {
        const push = setInterval(async () => {
            const platform = currentPlatformRef.current;
            if (!platform || !sessionStartRef.current) return;

            const now = new Date();
            const lastPush = lastPushedRef.current[platform];
            const segStart = lastPush ? new Date(lastPush) : sessionStartRef.current;

            await pushSession(platform, segStart, now);
            lastPushedRef.current[platform] = now.toISOString();
        }, PUSH_INTERVAL_MS);

        return () => clearInterval(push);
    }, [pushSession]);

    // ── Flush on page leave (visibilitychange + beforeunload) ───────────────
    useEffect(() => {
        const flush = async () => {
            const platform = currentPlatformRef.current;
            if (!platform || !sessionStartRef.current) return;

            const now = new Date();
            const lastPush = lastPushedRef.current[platform];
            const segStart = lastPush ? new Date(lastPush) : sessionStartRef.current;

            await pushSession(platform, segStart, now);
            lastPushedRef.current[platform] = now.toISOString();
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flush();
        };

        window.addEventListener('beforeunload', flush);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('beforeunload', flush);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [pushSession]);

    // Also flush when navigating away from a social platform page
    useEffect(() => {
        // This runs when location changes — if we *were* on a platform, flush the outgoing session
        return () => {
            const platform = currentPlatformRef.current;
            const sessionStart = sessionStartRef.current;
            if (!platform || !sessionStart) return;

            const now = new Date();
            const lastPush = lastPushedRef.current[platform];
            const segStart = lastPush ? new Date(lastPush) : sessionStart;
            pushSession(platform, segStart, now);
            lastPushedRef.current[platform] = now.toISOString();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // ── Alert logic ─────────────────────────────────────────────────────────
    useEffect(() => {
        Object.values(SOCIAL_ROUTES).forEach(platform => {
            const seconds = platformTimes[platform] || 0;
            const limitKey = `limit_${platform}`;
            const warnKey = `warning_${platform}`; // must match the key dismissAlert stores

            if (seconds >= DEFAULT_DAILY_LIMIT_SECONDS && !dismissedAlerts[limitKey]) {
                setActiveAlert(prev =>
                    prev?.platform === platform && prev?.type === 'limit' ? prev
                        : { platform, seconds, type: 'limit' }
                );
            } else if (
                seconds >= ALERT_THRESHOLD_SECONDS &&
                seconds < DEFAULT_DAILY_LIMIT_SECONDS &&
                !dismissedAlerts[warnKey] &&
                !dismissedAlerts[limitKey]
            ) {
                setActiveAlert(prev =>
                    prev?.platform === platform && prev?.type === 'warning' ? prev
                        : { platform, seconds, type: 'warning' }
                );
            }
        });
    }, [platformTimes, dismissedAlerts]);

    // ── Derived values ──────────────────────────────────────────────────────
    const totalTodaySeconds = Object.values(platformTimes).reduce((a, b) => a + b, 0);
    const totalTodayMinutes = totalTodaySeconds / 60;

    const dismissAlert = useCallback((platform, type) => {
        const key = `${type}_${platform}`;
        const seconds = platformTimesRef.current[platform] || 0;
        const updatedDismissed = { ...dismissedAlerts, [key]: true };
        setDismissedAlerts(updatedDismissed);
        saveDismissedAlerts(updatedDismissed);

        // Record into the log so Dashboard can display it (deduplicate by platform+type)
        setDismissedAlertsLog(prev => {
            const filtered = prev.filter(a => !(a.platform === platform && a.type === type));
            const entry = { platform, type, seconds, dismissedAt: new Date() };
            const updated = [...filtered, entry];
            saveDismissedLog(updated);
            return updated;
        });
        setActiveAlert(null);
    }, [dismissedAlerts]);

    const resetPlatformTime = useCallback((platform) => {
        setPlatformTimes(prev => {
            const updated = { ...prev, [platform]: 0 };
            saveStoredTimes(updated);
            broadcastTimes(updated);
            return updated;
        });
        setDismissedAlerts(prev => {
            const updated = { ...prev };
            delete updated[`limit_${platform}`];
            delete updated[`warn_${platform}`];
            saveDismissedAlerts(updated);
            return updated;
        });
    }, [broadcastTimes]);

    const getFormattedTime = useCallback((platform) => {
        const s = platformTimes[platform] || 0;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }, [platformTimes]);

    const getLimitSeconds = () => DEFAULT_DAILY_LIMIT_SECONDS;

    return (
        <ScreenTimeContext.Provider value={{
            platformTimes,
            activePlatform,
            activeAlert,
            dismissAlert,
            dismissedAlerts,
            dismissedAlertsLog,
            resetPlatformTime,
            getFormattedTime,
            getLimitSeconds,
            totalTodaySeconds,
            totalTodayMinutes,
            SOCIAL_ROUTES,
            ALERT_THRESHOLD_SECONDS,
            DEFAULT_DAILY_LIMIT_SECONDS,
            PLATFORM_API_MAP,
        }}>
            {children}
        </ScreenTimeContext.Provider>
    );
}

export const useScreenTime = () => {
    const ctx = useContext(ScreenTimeContext);
    if (!ctx) throw new Error('useScreenTime must be inside ScreenTimeProvider');
    return ctx;
};
