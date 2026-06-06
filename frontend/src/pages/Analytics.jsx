import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Brain, Cpu, BarChart3, TrendingUp, Target, Loader2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts';

const RISK_COLORS = { normal: '#10b981', at_risk: '#f59e0b', addicted: '#ef4444' };

export default function Analytics() {
    const [prediction, setPrediction] = useState(null);
    const [bsmasHistory, setBsmasHistory] = useState([]);
    const [loadingPredict, setLoadingPredict] = useState(false);
    const [loadingTrain, setLoadingTrain] = useState(false);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        try {
            const res = await analyticsAPI.getBSMASHistory();
            setBsmasHistory(res.data);
        } catch { /* ignore */ }
    };

    const runPrediction = async () => {
        setLoadingPredict(true);
        try {
            const res = await analyticsAPI.predict();
            setPrediction(res.data);
            toast.success('ML prediction completed!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Prediction failed');
        }
        setLoadingPredict(false);
    };

    const trainModel = async () => {
        setLoadingTrain(true);
        try {
            const res = await analyticsAPI.trainModel();
            toast.success(`Model trained! Accuracy: ${(res.data.metrics.accuracy * 100).toFixed(1)}%`);
        } catch (err) {
            toast.error('Training failed');
        }
        setLoadingTrain(false);
    };

    // Feature importance chart data
    const featureData = prediction?.top_contributing_features?.map(f => ({
        name: f.feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 20),
        importance: Math.round(f.importance * 1000) / 10,
    })) || [];

    // Confidence chart
    const confidenceData = prediction?.confidence
        ? Object.entries(prediction.confidence).map(([key, val]) => ({
            name: key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: Math.round(val * 100),
            color: RISK_COLORS[key] || '#6366f1',
        }))
        : [];

    // BSMAS trend data
    const bsmasTrend = [...bsmasHistory].reverse().map(s => ({
        date: s.assessed_at?.slice(5, 10),
        score: s.percentage,
        classification: s.classification,
    }));

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                    <Brain size={28} style={{ display: 'inline', marginRight: 10 }} />
                    Analytics & <span className="gradient-text">ML Engine</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    Machine Learning-powered addiction detection and BSMAS scoring analysis.
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={runPrediction} disabled={loadingPredict}>
                    {loadingPredict ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                    {loadingPredict ? 'Running...' : 'Run ML Prediction'}
                </button>
                <button className="btn-secondary" onClick={trainModel} disabled={loadingTrain}>
                    {loadingTrain ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
                    {loadingTrain ? 'Training...' : 'Re-train Model'}
                </button>
            </div>

            {/* Prediction Results */}
            {prediction && (
                <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Risk Level Result */}
                    <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>ML Predicted Risk</h3>
                        <div style={{
                            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
                            background: `radial-gradient(circle, ${RISK_COLORS[prediction.risk_level]}33, transparent)`,
                            border: `3px solid ${RISK_COLORS[prediction.risk_level]}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        }}>
                            <span style={{ fontSize: 28, fontWeight: 800, color: RISK_COLORS[prediction.risk_level] }}>
                                {Math.round(prediction.primary_confidence * 100)}%
                            </span>
                        </div>
                        <span className={`badge badge-${prediction.risk_level.replace('_', '-')}`}>
                            {prediction.risk_level.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Confidence Breakdown */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Confidence Breakdown</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={confidenceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                                <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={70} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                    {confidenceData.map((d, i) => (
                                        <Cell key={i} fill={d.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Feature Importance */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Top Contributing Features</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {featureData.map((f, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.name}</span>
                                        <span style={{ fontSize: 11, color: 'var(--primary-400)', fontWeight: 600 }}>{f.importance}%</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3,
                                            background: 'linear-gradient(90deg, var(--primary-600), var(--accent-400))',
                                            width: `${Math.min(f.importance * 5, 100)}%`,
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* BSMAS History Chart */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                    <BarChart3 size={18} style={{ display: 'inline', marginRight: 8 }} />
                    BSMAS Score Trend
                </h3>
                {bsmasTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={bsmasTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-medium)',
                                    borderRadius: 10,
                                    fontSize: 12,
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={{ fill: '#8b5cf6', r: 5 }}
                                activeDot={{ r: 7 }}
                                name="BSMAS %"
                            />
                            {/* Threshold lines */}
                            <Line type="monotone" dataKey={() => 50} stroke="#f59e0b" strokeDasharray="5 5" dot={false} name="At-Risk Threshold" />
                            <Line type="monotone" dataKey={() => 75} stroke="#ef4444" strokeDasharray="5 5" dot={false} name="Addicted Threshold" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Complete BSMAS assessments to see your score trend
                    </div>
                )}
            </div>
        </div>
    );
}
