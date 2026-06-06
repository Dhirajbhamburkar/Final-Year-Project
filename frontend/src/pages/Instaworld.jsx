import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Search, Home, PlusSquare, Compass, Film, User, Bell } from 'lucide-react';
import { useScreenTime } from '../context/ScreenTimeContext';

// ── Fake data ────────────────────────────────────────────────────────────
const FAKE_STORIES = [
    { id: 1, user: 'alex_gram', avatar: '🧑‍🎨', seen: false },
    { id: 2, user: 'travel.diary', avatar: '✈️', seen: false },
    { id: 3, user: 'foodie.life', avatar: '🍜', seen: true },
    { id: 4, user: 'tech.vibes', avatar: '💻', seen: false },
    { id: 5, user: 'gym.beast', avatar: '💪', seen: true },
    { id: 6, user: 'arty.soul', avatar: '🎨', seen: false },
    { id: 7, user: 'city.lens', avatar: '📷', seen: false },
];

const FAKE_POSTS = [
    {
        id: 1,
        user: 'alex_gram',
        avatar: '🧑‍🎨',
        location: 'New York, USA',
        time: '2m ago',
        image: 'https://picsum.photos/seed/insta1/600/600',
        likes: 2847,
        comments: 143,
        caption: 'Golden hour hits different in the city 🌆✨ Every corner tells a story.',
        tags: ['photography', 'nyc', 'goldenhour'],
        liked: false,
        saved: false,
    },
    {
        id: 2,
        user: 'travel.diary',
        avatar: '✈️',
        location: 'Santorini, Greece',
        time: '15m ago',
        image: 'https://picsum.photos/seed/insta2/600/600',
        likes: 5321,
        comments: 287,
        caption: 'Woke up to this view and forgot all my problems 🤍🏛️ #blessed',
        tags: ['travel', 'greece', 'wanderlust'],
        liked: true,
        saved: false,
    },
    {
        id: 3,
        user: 'foodie.life',
        avatar: '🍜',
        location: 'Tokyo, Japan',
        time: '42m ago',
        image: 'https://picsum.photos/seed/insta3/600/600',
        likes: 1234,
        comments: 89,
        caption: 'Ramen at 2am is a lifestyle, not a choice 🍜🌙',
        tags: ['food', 'tokyo', 'ramen'],
        liked: false,
        saved: true,
    },
    {
        id: 4,
        user: 'tech.vibes',
        avatar: '💻',
        location: 'San Francisco, CA',
        time: '1h ago',
        image: 'https://picsum.photos/seed/insta4/600/600',
        likes: 987,
        comments: 56,
        caption: 'New setup achieved 🖥️ The desk is finally ready for Q1 grind. DM for setup details!',
        tags: ['techsetup', 'workspace', 'developer'],
        liked: false,
        saved: false,
    },
    {
        id: 5,
        user: 'arty.soul',
        avatar: '🎨',
        location: 'Paris, France',
        time: '3h ago',
        image: 'https://picsum.photos/seed/insta5/600/600',
        likes: 4102,
        comments: 312,
        caption: 'Sometimes art is just letting go 🎨🌊 New piece dropping this weekend.',
        tags: ['art', 'painting', 'abstract'],
        liked: true,
        saved: true,
    },
];

const FAKE_SUGGESTIONS = [
    { id: 1, user: 'mike.photo', avatar: '📸', mutual: '3' },
    { id: 2, user: 'wellness.hub', avatar: '🧘', mutual: '7' },
    { id: 3, user: 'dev.journey', avatar: '⌨️', mutual: '12' },
];

// ── Sub-components ────────────────────────────────────────────────────────
function StoryCircle({ story }) {
    const [seen, setSeen] = useState(story.seen);
    return (
        <button
            onClick={() => setSeen(true)}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, background: 'none', border: 'none', cursor: 'pointer',
                flexShrink: 0, padding: '4px 6px',
            }}
        >
            <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: seen ? 'var(--border-subtle)' : 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                padding: 2, transition: 'all 0.2s',
            }}>
                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, border: '2px solid var(--bg-surface)',
                }}>
                    {story.avatar}
                </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {story.user}
            </span>
        </button>
    );
}

function PostCard({ post: initialPost }) {
    const [post, setPost] = useState(initialPost);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleLike = () => setPost(p => ({
        ...p,
        liked: !p.liked,
        likes: p.liked ? p.likes - 1 : p.likes + 1,
    }));

    const toggleSave = () => setPost(p => ({ ...p, saved: !p.saved }));

    return (
        <article style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f09433, #bc1888)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                }}>
                    {post.avatar}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{post.user}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.location} · {post.time}</div>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(m => !m)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                        <div style={{
                            position: 'absolute', right: 0, top: '100%',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                            borderRadius: 10, padding: '6px 0', minWidth: 140, zIndex: 10,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        }}>
                            {['Not interested', 'Unfollow', 'Report', 'Copy link'].map(opt => (
                                <button key={opt} onClick={() => setMenuOpen(false)} style={{
                                    display: 'block', width: '100%', padding: '8px 16px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 13, color: opt === 'Report' ? '#ef4444' : 'var(--text-primary)',
                                    textAlign: 'left', transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >{opt}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image */}
            <div style={{ position: 'relative', background: 'var(--bg-elevated)', aspectRatio: '1' }}>
                <img
                    src={post.image}
                    alt={post.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                />
            </div>

            {/* Actions */}
            <div style={{ padding: '12px 16px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                    <button onClick={toggleLike} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                        color: post.liked ? '#ef4444' : 'var(--text-secondary)',
                        transform: post.liked ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.2s',
                    }}>
                        <Heart size={24} fill={post.liked ? '#ef4444' : 'none'} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2 }}>
                        <MessageCircle size={24} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2 }}>
                        <Share2 size={24} />
                    </button>
                    <button onClick={toggleSave} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                        color: post.saved ? 'var(--primary-400)' : 'var(--text-secondary)', marginLeft: 'auto',
                        transition: 'all 0.2s',
                    }}>
                        <Bookmark size={24} fill={post.saved ? 'var(--primary-400)' : 'none'} />
                    </button>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {post.likes.toLocaleString()} likes
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: 6 }}>{post.user}</span>
                    {post.caption}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {post.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 12, color: '#818cf8', cursor: 'pointer' }}>#{tag}</span>
                    ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    View all {post.comments} comments
                </div>

                {/* Comment input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-600), var(--accent-500))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0,
                    }}>👤</div>
                    <input
                        placeholder="Add a comment…"
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            fontSize: 13, color: 'var(--text-secondary)',
                            fontFamily: 'inherit',
                        }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--primary-400)', fontWeight: 600, cursor: 'pointer' }}>Post</span>
                </div>
            </div>
        </article>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Instaworld() {
    const { getFormattedTime, platformTimes, DEFAULT_DAILY_LIMIT_SECONDS } = useScreenTime();
    const [activeTab, setActiveTab] = useState('home');
    const used = platformTimes['Instaworld'] || 0;
    const pct = Math.min((used / DEFAULT_DAILY_LIMIT_SECONDS) * 100, 100);

    const barColor = pct >= 100 ? '#ef4444' : pct >= 66 ? '#f59e0b' : '#10b981';

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'var(--text-primary)' }}>
            {/* Top Nav */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                {/* Logo */}
                <div style={{
                    fontSize: 22, fontWeight: 800, letterSpacing: -1,
                    background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>
                    Instaworld
                </div>

                {/* Screen time pill */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
                    background: 'rgba(255,255,255,0.06)', borderRadius: 20,
                    border: `1px solid ${barColor}40`,
                }}>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 1s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: barColor, fontWeight: 600 }}>
                        {getFormattedTime('Instaworld')}
                    </span>
                </div>

                {/* Icons */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <PlusSquare size={24} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <Bell size={24} />
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: 470, margin: '0 auto', padding: '0 0 80px' }}>
                {/* Stories */}
                <div style={{
                    overflowX: 'auto', display: 'flex', gap: 4,
                    padding: '16px 16px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    scrollbarWidth: 'none',
                }}>
                    {/* Add story */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, padding: '4px 6px', cursor: 'pointer' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1.5px dashed rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24,
                        }}>
                            ➕
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your story</span>
                    </div>
                    {FAKE_STORIES.map(s => <StoryCircle key={s.id} story={s} />)}
                </div>

                {/* Suggestions */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Suggested for you</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>See all</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        {FAKE_SUGGESTIONS.map(s => (
                            <div key={s.id} style={{
                                flexShrink: 0, width: 130,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 32, marginBottom: 6 }}>{s.avatar}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.user}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{s.mutual} mutual friends</div>
                                <button style={{
                                    width: '100%', padding: '7px',
                                    background: 'linear-gradient(135deg, #f09433, #bc1888)',
                                    border: 'none', borderRadius: 8,
                                    color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>Follow</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feed */}
                <div style={{ padding: '16px 0' }}>
                    {FAKE_POSTS.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            </div>

            {/* Bottom Nav */}
            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '12px 0', zIndex: 100,
            }}>
                {[
                    { icon: Home, tab: 'home' },
                    { icon: Search, tab: 'search' },
                    { icon: Film, tab: 'reels' },
                    { icon: Compass, tab: 'explore' },
                    { icon: User, tab: 'profile' },
                ].map(({ icon: Icon, tab }) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                        color: activeTab === tab ? 'white' : 'var(--text-muted)',
                        transform: activeTab === tab ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s',
                    }}>
                        <Icon size={24} fill={activeTab === tab ? 'white' : 'none'} />
                    </button>
                ))}
            </nav>
        </div>
    );
}
