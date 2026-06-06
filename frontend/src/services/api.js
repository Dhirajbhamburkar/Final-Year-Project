import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('smads_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('smads_token');
            localStorage.removeItem('smads_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Auth ──
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updatePreferences: (prefs) => api.put('/auth/preferences', prefs),
};

// ── Usage ──
export const usageAPI = {
    submitLog: (data) => api.post('/usage/log', data),
    submitBatch: (data) => api.post('/usage/log/batch', data),
    getDailySummary: (date) => api.get('/usage/summary/daily', { params: { date } }),
    getWeeklyTrends: (weeks) => api.get('/usage/trends/weekly', { params: { weeks } }),
    getHeatmap: (days) => api.get('/usage/heatmap', { params: { days } }),
};

// ── Analytics ──
export const analyticsAPI = {
    predict: () => api.get('/analytics/predict'),
    trainModel: () => api.post('/analytics/train'),
    submitBSMAS: (data) => api.post('/analytics/bsmas', data),
    getBSMASHistory: () => api.get('/analytics/bsmas/history'),
    getRecovery: () => api.get('/analytics/recovery'),
};

// ── Alerts ──
export const alertsAPI = {
    getAlerts: (unreadOnly = false) => api.get('/alerts/', { params: { unread_only: unreadOnly } }),
    markRead: (id) => api.put(`/alerts/${id}/read`),
    markAllRead: () => api.put('/alerts/read-all'),
};

// ── Interventions ──
export const interventionsAPI = {
    getSuggestions: () => api.get('/interventions/suggestions'),
    startFocusMode: (duration) => api.post('/interventions/focus-mode', null, { params: { duration } }),
    completeFocusMode: (id) => api.put(`/interventions/focus-mode/${id}/complete`),
    getHistory: () => api.get('/interventions/history'),
};

export default api;
