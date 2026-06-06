import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('smads_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            authAPI.getProfile()
                .then(res => {
                    setUser(res.data);
                    setLoading(false);
                })
                .catch(() => {
                    logout();
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { access_token, user: userData } = res.data;
        localStorage.setItem('smads_token', access_token);
        localStorage.setItem('smads_user', JSON.stringify(userData));
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        const { access_token, user: userData } = res.data;
        localStorage.setItem('smads_token', access_token);
        localStorage.setItem('smads_user', JSON.stringify(userData));
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('smads_token');
        localStorage.removeItem('smads_user');
        setToken(null);
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const res = await authAPI.getProfile();
            setUser(res.data);
        } catch { /* ignore */ }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};
