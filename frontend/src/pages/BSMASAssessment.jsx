import { useState } from 'react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ClipboardCheck, Send, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const QUESTIONS = [
    { key: 'salience', label: 'Salience', question: 'How often do you spend a lot of time thinking about social media or planning its use?' },
    { key: 'tolerance', label: 'Tolerance', question: 'How often do you feel an urge to use social media more and more?' },
    { key: 'mood_modification', label: 'Mood Modification', question: 'How often do you use social media to forget about personal problems?' },
    { key: 'relapse', label: 'Relapse', question: 'How often have you tried to cut down on social media use without success?' },
    { key: 'withdrawal', label: 'Withdrawal', question: 'How often do you become restless or troubled if unable to use social media?' },
    { key: 'conflict', label: 'Conflict', question: 'How often do you use social media so much that it has negatively impacted your studies or work?' },
    { key: 'sleep_impact', label: 'Sleep Impact', question: 'How often has social media usage negatively affected your sleep quality?' },
    { key: 'fomo', label: 'FOMO', question: "How often do you feel you'll miss out on something if you don't check social media?" },
    { key: 'comparison', label: 'Self-Comparison', question: 'How often do you negatively compare yourself to others on social media?' },
];

const SCALE_OPTIONS = [
    { value: 1, label: 'Very Rarely', emoji: '😌' },
    { value: 2, label: 'Rarely', emoji: '🙂' },
    { value: 3, label: 'Sometimes', emoji: '😐' },
    { value: 4, label: 'Often', emoji: '😟' },
    { value: 5, label: 'Very Often', emoji: '😰' },
];

export default function BSMASAssessment() {
    const [responses, setResponses] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);

    const handleSelect = (key, value) => {
        setResponses(prev => ({ ...prev, [key]: value }));
        if (currentQ < QUESTIONS.length - 1) {
            setTimeout(() => setCurrentQ(prev => prev + 1), 300);
        }
    };

    const allAnswered = QUESTIONS.every(q => responses[q.key]);

    const submit = async () => {
        if (!allAnswered) {
            toast.error('Please answer all 9 questions.');
            return;
        }
        setLoading(true);
        try {
            const res = await analyticsAPI.submitBSMAS(responses);
            setResult(res.data);
            toast.success('BSMAS assessment submitted!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Submission failed');
        }
        setLoading(false);
    };

    const resetForm = () => {
        setResponses({});
        setResult(null);
        setCurrentQ(0);
    };

    const classColors = { normal: '#10b981', at_risk: '#f59e0b', addicted: '#ef4444' };
    const trendIcons = {
        improving: <TrendingDown size={16} color="#10b981" />,
        worsening: <TrendingUp size={16} color="#ef4444" />,
        stable: <Minus size={16} color="#f59e0b" />,
    };

    if (result) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Assessment Complete</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Modified Bergen Social Media Addiction Scale Results</p>
                </div>

                <div className="glass-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
                    {/* Score Circle */}
                    <div style={{
                        width: 160, height: 160, borderRadius: '50%', margin: '0 auto 20px',
                        background: `conic-gradient(${classColors[result.classification]} ${result.percentage * 3.6}deg, var(--bg-elevated) 0deg)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            width: 126, height: 126, borderRadius: '50%', background: 'var(--bg-surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        }}>
                            <span style={{ fontSize: 40, fontWeight: 800, color: classColors[result.classification] }}>
                                {result.total_score}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {result.max_score}</span>
                        </div>
                    </div>

                    <span className={`badge badge-${result.classification.replace('_', '-')}`} style={{ fontSize: 14, padding: '6px 20px' }}>
                        {result.classification.replace('_', ' ')}
                    </span>

                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 16, color: classColors[result.classification] }}>
                        {result.percentage.toFixed(1)}%
                    </div>

                    {/* Trend */}
                    {result.trend && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                            padding: '6px 14px', borderRadius: 20,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                            fontSize: 13,
                        }}>
                            {trendIcons[result.trend]}
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {result.trend === 'improving' ? 'Improving' : result.trend === 'worsening' ? 'Worsening' : 'Stable'}
                                {result.previous_score !== null && ` (prev: ${result.previous_score})`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Breakdown */}
                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Score Breakdown</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {Object.entries(result.breakdown).map(([key, val]) => (
                            <div key={key} style={{
                                padding: 12, borderRadius: 10,
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: val >= 4 ? '#ef4444' : val >= 3 ? '#f59e0b' : '#10b981' }}>
                                    {val}/5
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'capitalize' }}>
                                    {key.replace('_', ' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="btn-primary" onClick={resetForm} style={{ width: '100%' }}>
                    Take Another Assessment
                </button>
            </div>
        );
    }

    const progress = (Object.keys(responses).length / QUESTIONS.length) * 100;
    const q = QUESTIONS[currentQ];

    return (
        <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                    <ClipboardCheck size={28} style={{ display: 'inline', marginRight: 10 }} />
                    BSMAS <span className="gradient-text">Assessment</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    Modified Bergen Social Media Addiction Scale — 9 questions to assess your digital wellbeing.
                </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Question {currentQ + 1} of {QUESTIONS.length}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--primary-400)', fontWeight: 600 }}>
                        {Math.round(progress)}%
                    </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 3,
                        background: 'linear-gradient(90deg, var(--primary-600), var(--accent-400))',
                        width: `${progress}%`,
                        transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }} />
                </div>
            </div>

            {/* Question Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {QUESTIONS.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentQ(i)}
                        style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: `1px solid ${currentQ === i ? 'var(--primary-500)' : responses[q.key] ? 'var(--success)' : 'var(--border-subtle)'}`,
                            background: responses[q.key] ? 'rgba(16,185,129,0.15)' : currentQ === i ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                            color: responses[q.key] ? 'var(--success)' : currentQ === i ? 'var(--primary-400)' : 'var(--text-muted)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Current Question */}
            <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
                <div style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--primary-400)',
                    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
                }}>
                    {q.label}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, lineHeight: 1.5 }}>
                    {q.question}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {SCALE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleSelect(q.key, opt.value)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 18px', borderRadius: 12,
                                border: `1px solid ${responses[q.key] === opt.value ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                                background: responses[q.key] === opt.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: 14, cursor: 'pointer', textAlign: 'left',
                                transition: 'all var(--transition-fast)',
                                width: '100%',
                            }}
                        >
                            <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                            <span style={{ fontWeight: responses[q.key] === opt.value ? 600 : 400 }}>
                                {opt.value}. {opt.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                    className="btn-secondary"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                >
                    ← Previous
                </button>
                {currentQ < QUESTIONS.length - 1 ? (
                    <button
                        className="btn-primary"
                        disabled={!responses[q.key]}
                        onClick={() => setCurrentQ(prev => prev + 1)}
                    >
                        Next →
                    </button>
                ) : (
                    <button className="btn-primary" onClick={submit} disabled={!allAnswered || loading}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {loading ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                )}
            </div>
        </div>
    );
}
