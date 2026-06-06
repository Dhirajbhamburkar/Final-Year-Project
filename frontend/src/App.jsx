import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScreenTimeProvider } from './context/ScreenTimeContext';
import ScreenTimeAlert from './components/ScreenTimeAlert';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Interventions from './pages/Interventions';
import BSMASAssessment from './pages/BSMASAssessment';
import Login from './pages/Login';
import Register from './pages/Register';
import Instaworld from './pages/Instaworld';
import Faceworld from './pages/Faceworld';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function LoadingScreen() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'var(--bg-base)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: 32, fontWeight: 800 }}>SMADS</div>
                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Loading...</p>
            </div>
        </div>
    );
}

function AppLayout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Routes>
                <Route path="/" element={<PaddedMain><Dashboard /></PaddedMain>} />
                <Route path="/analytics" element={<PaddedMain><Analytics /></PaddedMain>} />
                <Route path="/alerts" element={<PaddedMain><Alerts /></PaddedMain>} />
                <Route path="/interventions" element={<PaddedMain><Interventions /></PaddedMain>} />
                <Route path="/assessment" element={<PaddedMain><BSMASAssessment /></PaddedMain>} />
                <Route path="/instaworld" element={<SocialMain><Instaworld /></SocialMain>} />
                <Route path="/faceworld" element={<SocialMain><Faceworld /></SocialMain>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <div className="bg-mesh" />
            <ScreenTimeAlert />
        </div>
    );
}

function PaddedMain({ children }) {
    return (
        <main style={{ flex: 1, marginLeft: 260, padding: '24px 32px', overflowY: 'auto', minHeight: '100vh' }}>
            {children}
        </main>
    );
}

function SocialMain({ children }) {
    return (
        <main style={{ flex: 1, marginLeft: 260, padding: 0, overflowY: 'auto', minHeight: '100vh' }}>
            {children}
        </main>
    );
}


export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ScreenTimeProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                            },
                        }}
                    />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/*" element={
                            <ProtectedRoute><AppLayout /></ProtectedRoute>
                        } />
                    </Routes>
                </ScreenTimeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
