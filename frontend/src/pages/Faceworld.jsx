import { useState } from 'react';
import {
    ThumbsUp, MessageSquare, Share, Globe, Users, Lock,
    Search, Bell, ChevronDown, MoreHorizontal, Video, Image, SmilePlus,
    Home, Play, ShoppingBag, UserCircle, Menu, X
} from 'lucide-react';
import { useScreenTime } from '../context/ScreenTimeContext';

// ── Fake Data ─────────────────────────────────────────────────────────────
const FAKE_FRIENDS = [
    { id: 1, name: 'Sarah Johnson', avatar: '👩‍💼', status: 'online', mutual: 12 },
    { id: 2, name: 'Mike Chen', avatar: '👨‍💻', status: 'online', mutual: 5 },
    { id: 3, name: 'Priya Sharma', avatar: '👩‍🎓', status: 'offline', mutual: 8 },
    { id: 4, name: 'James Walker', avatar: '🧑‍🍳', status: 'online', mutual: 3 },
    { id: 5, name: 'Emma Davis', avatar: '👩‍🎨', status: 'offline', mutual: 15 },
    { id: 6, name: 'Raj Patel', avatar: '👨‍🔬', status: 'online', mutual: 7 },
];

const FAKE_GROUPS = [
    { id: 1, name: 'Dev Community 🌐', members: '12.4K members', icon: '💻' },
    { id: 2, name: 'Travel Enthusiasts ✈️', members: '8.2K members', icon: '🗺️' },
    { id: 3, name: 'Foodies Unite! 🍕', members: '5.7K members', icon: '🍕' },
];

const STORY_USERS = [
    { id: 1, name: 'Sarah', avatar: '👩‍💼', color: '#1877f2' },
    { id: 2, name: 'Mike', avatar: '👨‍💻', color: '#42b72a' },
    { id: 3, name: 'Priya', avatar: '👩‍🎓', color: '#e4405f' },
    { id: 4, name: 'James', avatar: '🧑‍🍳', color: '#ff8c00' },
    { id: 5, name: 'Emma', avatar: '👩‍🎨', color: '#9c27b0' },
];

const FAKE_POSTS = [
    {
        id: 1,
        user: 'Sarah Johnson',
        avatar: '👩‍💼',
        privacy: 'public',
        time: '3 minutes ago',
        text: "Just landed in Bali after 18 hours of travel! 🌴✈️ Sometimes you just need to step away from work and breathe. Who else is a spontaneous travel person here? Drop a ✋ below!",
        image: 'https://picsum.photos/seed/fb1/700/400',
        likes: 347,
        comments: 58,
        shares: 12,
        reactions: ['👍', '❤️', '😍'],
        liked: false,
    },
    {
        id: 2,
        user: 'Dev Community 🌐',
        avatar: '💻',
        privacy: 'group',
        time: '21 minutes ago',
        text: "🚀 Big news: We're hosting a FREE online hackathon next weekend! 48 hours, 3 tracks (AI, Web3, Open Source). Prizes worth $10,000. Form your team or join solo. Link in comments!",
        image: null,
        likes: 892,
        comments: 204,
        shares: 331,
        reactions: ['👍', '🔥', '🎉'],
        liked: true,
    },
    {
        id: 3,
        user: 'Mike Chen',
        avatar: '👨‍💻',
        privacy: 'friends',
        time: '1 hour ago',
        text: "Finished my first 10K run today! 🏃‍♂️💨 Started training just 6 months ago and couldn't even run 1K. Consistency truly is everything. Next goal: half marathon by June!",
        image: 'https://picsum.photos/seed/fb2/700/400',
        likes: 523,
        comments: 89,
        shares: 7,
        reactions: ['👍', '💪', '❤️'],
        liked: false,
    },
    {
        id: 4,
        user: 'Priya Sharma',
        avatar: '👩‍🎓',
        privacy: 'public',
        time: '2 hours ago',
        text: "📚 Reading list for March:\n• Deep Work – Cal Newport\n• Thinking, Fast and Slow\n• The Psychology of Money\n\nCurrently halfway through Deep Work and it's genuinely life-changing. What are you all reading this month?",
        image: null,
        likes: 218,
        comments: 145,
        shares: 43,
        reactions: ['👍', '❤️', '😮'],
        liked: false,
    },
    {
        id: 5,
        user: 'Foodies Unite! 🍕',
        avatar: '🍕',
        privacy: 'group',
        time: '4 hours ago',
        text: "Recipe of the week: Homemade Sourdough Bread 🍞\n\nThe crust? Perfection. The crumb? Open and chewy. Took 3 failed attempts but SO worth it. Full recipe + tips in the thread! Share your baking adventures below 👇",
        image: 'https://picsum.photos/seed/fb3/700/400',
        likes: 1204,
        comments: 387,
        shares: 156,
        reactions: ['❤️', '😍', '🤤'],
        liked: true,
    },
];

const NAV_ITEMS = [
    { icon: Home, label: 'Home' },
    { icon: Play, label: 'Watch' },
    { icon: Users, label: 'Groups' },
    { icon: ShoppingBag, label: 'Marketplace' },
    { icon: Video, label: 'Live' },
];

const PRIVACY_ICONS = { public: Globe, friends: Users, group: Users, private: Lock };
const PRIVACY_LABELS = { public: 'Public', friends: 'Friends', group: 'Group', private: 'Only me' };

// ── Post Card ─────────────────────────────────────────────────────────────
function FBPostCard({ post: initPost }) {
    const [post, setPost] = useState(initPost);
    const [menuOpen, setMenuOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showCommentBox, setShowCommentBox] = useState(false);

    const toggleLike = () => setPost(p => ({
        ...p, liked: !p.liked,
        likes: p.liked ? p.likes - 1 : p.likes + 1,
    }));

    const PrivacyIcon = PRIVACY_ICONS[post.privacy] || Globe;

    return (
        <div style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, marginBottom: 16, overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px', gap: 12 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#1877f2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                }}>
                    {post.avatar}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e6eb', marginBottom: 2 }}>{post.user}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 13, color: '#b0b3b8' }}>{post.time} ·</span>
                        <PrivacyIcon size={13} color="#b0b3b8" />
                        <span style={{ fontSize: 13, color: '#b0b3b8' }}>{PRIVACY_LABELS[post.privacy]}</span>
                    </div>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(m => !m)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b3b8', padding: 6, borderRadius: '50%' }}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                        <div style={{
                            position: 'absolute', right: 0, top: '100%',
                            background: '#242526', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10, padding: '6px 0', minWidth: 180, zIndex: 10,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}>
                            {['Save post', 'Hide post', 'Report post', 'Unfollow'].map(opt => (
                                <button key={opt} onClick={() => setMenuOpen(false)} style={{
                                    display: 'block', width: '100%', padding: '8px 16px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 14, color: opt === 'Report post' ? '#ef4444' : '#e4e6eb',
                                    textAlign: 'left', transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >{opt}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Text */}
            <div style={{ padding: '0 16px 12px', fontSize: 15, color: '#e4e6eb', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {post.text}
            </div>

            {/* Image */}
            {post.image && (
                <img src={post.image} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} loading="lazy" />
            )}

            {/* Reaction count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex' }}>
                        {post.reactions.map((r, i) => (
                            <span key={i} style={{
                                fontSize: 16, width: 22, height: 22, borderRadius: '50%',
                                background: '#242526', border: '1.5px solid #18191a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginLeft: i > 0 ? -6 : 0, zIndex: post.reactions.length - i,
                            }}>{r}</span>
                        ))}
                    </div>
                    <span style={{ fontSize: 14, color: '#b0b3b8', marginLeft: 4 }}>{post.likes.toLocaleString()}</span>
                </div>
                <span style={{ fontSize: 14, color: '#b0b3b8' }}>{post.comments} comments · {post.shares} shares</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', padding: '4px 8px', gap: 4 }}>
                {[
                    { icon: ThumbsUp, label: 'Like', action: toggleLike, active: post.liked, color: '#1877f2' },
                    { icon: MessageSquare, label: 'Comment', action: () => setShowCommentBox(s => !s), active: false, color: 'white' },
                    { icon: Share, label: 'Share', action: () => { }, active: false, color: 'white' },
                ].map(({ icon: Icon, label, action, active, color }) => (
                    <button
                        key={label}
                        onClick={action}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 6, padding: '8px',
                            background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8,
                            color: active ? color : '#b0b3b8',
                            fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <Icon size={18} fill={active ? color : 'none'} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Comment box */}
            {showCommentBox && (
                <div style={{ display: 'flex', gap: 10, padding: '0 16px 14px', alignItems: 'center' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#1877f2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
                    }}>👤</div>
                    <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Write a comment…"
                        style={{
                            flex: 1, padding: '10px 16px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                            color: '#e4e6eb', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

// ── Story Card ────────────────────────────────────────────────────────────
function StoryCard({ story, isAdd }) {
    if (isAdd) return (
        <div style={{
            width: 120, flexShrink: 0, height: 200, borderRadius: 12, overflow: 'hidden',
            background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', position: 'relative',
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{ height: 140, background: 'linear-gradient(135deg, #1e3a5f, #1877f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                👤
            </div>
            <div style={{
                position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%)',
                width: 36, height: 36, borderRadius: '50%', background: '#1877f2',
                border: '3px solid #18191a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: 'white', fontWeight: 700,
            }}>+</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 8px 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e6eb', textAlign: 'center' }}>Create Story</span>
            </div>
        </div>
    );

    return (
        <div style={{
            width: 120, flexShrink: 0, height: 200, borderRadius: 12, overflow: 'hidden',
            border: `2px solid ${story.color}`,
            cursor: 'pointer', position: 'relative',
            background: `linear-gradient(160deg, ${story.color}33, #18191a)`,
        }}>
            <div style={{ padding: 10 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: `3px solid ${story.color}`,
                    background: '#1c1c1e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                    {story.avatar}
                </div>
            </div>
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to top, rgba(0,0,0,0.8) 30%, transparent)`,
                display: 'flex', alignItems: 'flex-end', padding: '12px 10px',
            }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{story.name}</span>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Faceworld() {
    const { getFormattedTime, platformTimes, DEFAULT_DAILY_LIMIT_SECONDS } = useScreenTime();
    const [activeNav, setActiveNav] = useState('Home');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const used = platformTimes['Faceworld'] || 0;
    const pct = Math.min((used / DEFAULT_DAILY_LIMIT_SECONDS) * 100, 100);
    const barColor = pct >= 100 ? '#ef4444' : pct >= 66 ? '#f59e0b' : '#42b72a';

    return (
        <div style={{ minHeight: '100vh', background: '#18191a', color: '#e4e6eb', fontFamily: 'inherit' }}>
            {/* Top Nav */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(24,25,26,0.95)', backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center',
                padding: '0 16px', height: 56, gap: 12,
            }}>
                {/* Logo */}
                <div style={{
                    fontSize: 26, fontWeight: 900,
                    color: '#1877f2', flexShrink: 0, letterSpacing: -1,
                }}>
                    faceworld
                </div>

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.08)', borderRadius: 20,
                    padding: '7px 14px', flex: '0 0 auto', width: 220,
                }}>
                    <Search size={15} color="#b0b3b8" />
                    <input
                        placeholder="Search Faceworld"
                        style={{
                            background: 'none', border: 'none', outline: 'none',
                            color: '#e4e6eb', fontSize: 14, width: '100%', fontFamily: 'inherit',
                        }}
                    />
                </div>

                {/* Nav tabs */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {NAV_ITEMS.map(({ icon: Icon, label }) => (
                        <button
                            key={label}
                            onClick={() => setActiveNav(label)}
                            style={{
                                background: 'none',
                                border: 'none', cursor: 'pointer', padding: '8px 20px',
                                borderRadius: 8,
                                color: activeNav === label ? '#1877f2' : '#b0b3b8',
                                borderBottom: activeNav === label ? '3px solid #1877f2' : '3px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Icon size={22} fill={activeNav === label ? '#1877f2' : 'none'} />
                        </button>
                    ))}
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
                        {getFormattedTime('Faceworld')}
                    </span>
                </div>

                {/* Right icons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={20} />
                    </button>
                    <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCircle size={20} />
                    </button>
                </div>
            </header>

            {/* Body */}
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 20, padding: '20px 16px' }}>

                {/* LEFT SIDEBAR */}
                <aside style={{ position: 'sticky', top: 76, height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#e4e6eb' }}>You</span>
                    </div>
                    {[
                        { emoji: '👥', label: 'Friends' },
                        { emoji: '💬', label: 'Messenger' },
                        { emoji: '📺', label: 'Watch' },
                        { emoji: '🕐', label: 'Memories' },
                        { emoji: '📌', label: 'Saved' },
                        { emoji: '🏢', label: 'Pages' },
                        { emoji: '👥', label: 'Groups' },
                        { emoji: '🎮', label: 'Gaming' },
                    ].map(({ emoji, label }) => (
                        <div key={label} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            <span style={{ fontSize: 22 }}>{emoji}</span>
                            <span style={{ fontSize: 15, color: '#e4e6eb' }}>{label}</span>
                        </div>
                    ))}
                </aside>

                {/* MAIN FEED */}
                <main>
                    {/* Create Post */}
                    <div style={{
                        background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                            <div style={{
                                flex: 1, padding: '10px 16px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 20, cursor: 'pointer',
                                fontSize: 15, color: '#b0b3b8',
                            }}>
                                What's on your mind?
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                            {[
                                { icon: Video, label: 'Live video', color: '#ef4444' },
                                { icon: Image, label: 'Photo/Video', color: '#42b72a' },
                                { icon: SmilePlus, label: 'Feeling/Activity', color: '#f59e0b' },
                            ].map(({ icon: Icon, label, color }) => (
                                <button key={label} style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 6, padding: '8px', background: 'none', border: 'none',
                                    cursor: 'pointer', borderRadius: 8, color: '#b0b3b8', fontSize: 14, fontWeight: 500,
                                    transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <Icon size={18} color={color} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stories */}
                    <div style={{
                        display: 'flex', gap: 10, marginBottom: 16,
                        overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none',
                    }}>
                        <StoryCard isAdd />
                        {STORY_USERS.map(s => <StoryCard key={s.id} story={s} />)}
                    </div>

                    {/* Posts */}
                    {FAKE_POSTS.map(post => <FBPostCard key={post.id} post={post} />)}
                </main>

                {/* RIGHT SIDEBAR */}
                <aside style={{ position: 'sticky', top: 76, height: 'fit-content' }}>
                    {/* Online Friends */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 17, fontWeight: 700, color: '#e4e6eb' }}>Contacts</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b3b8', padding: 4, borderRadius: '50%' }}><Video size={18} /></button>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b3b8', padding: 4, borderRadius: '50%' }}><Search size={18} /></button>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b3b8', padding: 4, borderRadius: '50%' }}><MoreHorizontal size={18} /></button>
                            </div>
                        </div>
                        {FAKE_FRIENDS.map(f => (
                            <div key={f.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                        {f.avatar}
                                    </div>
                                    {f.status === 'online' && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: '#42b72a', border: '2px solid #18191a',
                                        }} />
                                    )}
                                </div>
                                <span style={{ fontSize: 15, color: '#e4e6eb' }}>{f.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Groups */}
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#e4e6eb', marginBottom: 10 }}>Your Groups</div>
                        {FAKE_GROUPS.map(g => (
                            <div key={g.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px', borderRadius: 8, cursor: 'pointer',
                                transition: 'background 0.15s', marginBottom: 4,
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1877f220', border: '1px solid #1877f240', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                                    {g.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e6eb' }}>{g.name}</div>
                                    <div style={{ fontSize: 12, color: '#b0b3b8' }}>{g.members}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
