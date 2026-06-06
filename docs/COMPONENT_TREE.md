# 🌳 Frontend Component Tree — SMADS

## Digital Wellness Dashboard Structure

```
App.jsx
├── <BrowserRouter>
│   ├── <AuthProvider>                          // Context: user, token, login/logout
│   │   ├── <Toaster />                        // react-hot-toast notifications
│   │   │
│   │   ├── Route: /login
│   │   │   └── <Login />                      // Glassmorphic login form
│   │   │       ├── Logo + Branding
│   │   │       ├── Email Input (with icon)
│   │   │       ├── Password Input (with icon)
│   │   │       ├── Submit Button
│   │   │       └── Demo Credentials Banner
│   │   │
│   │   ├── Route: /register
│   │   │   └── <Register />                   // Registration form
│   │   │       ├── Logo + Branding
│   │   │       ├── Full Name / Username / Email / Password / Age
│   │   │       └── Submit + Link to Login
│   │   │
│   │   └── Route: /* (Protected)
│   │       └── <ProtectedRoute>
│   │           └── <AppLayout>
│   │               ├── <Sidebar />             // Fixed left navigation
│   │               │   ├── Logo (Brain icon + "SMADS")
│   │               │   ├── Navigation Links
│   │               │   │   ├── 📊 Dashboard
│   │               │   │   ├── 📈 Analytics & ML
│   │               │   │   ├── 🔔 Alerts
│   │               │   │   ├── 🛡️ Interventions
│   │               │   │   └── 📋 BSMAS Assessment
│   │               │   └── User Profile Card
│   │               │       ├── Avatar
│   │               │       ├── Name + Risk Level Badge
│   │               │       └── Sign Out Button
│   │               │
│   │               ├── <main> (Content Area)
│   │               │   │
│   │               │   ├── Route: /
│   │               │   │   └── <Dashboard />                    ⭐ PRIMARY VIEW
│   │               │   │       │
│   │               │   │       ├── Header ("Digital Wellness Dashboard")
│   │               │   │       │
│   │               │   │       ├── KPI Cards Row (grid: 4 columns)
│   │               │   │       │   ├── 🎯 Addiction Index Card
│   │               │   │       │   │   ├── Activity icon + label
│   │               │   │       │   │   ├── Large number (color-coded by risk)
│   │               │   │       │   │   └── Risk level badge
│   │               │   │       │   ├── ⏰ Screen Time Today Card
│   │               │   │       │   │   ├── Clock icon + label
│   │               │   │       │   │   ├── Formatted time (Xh Ym)
│   │               │   │       │   │   └── Daily limit indicator
│   │               │   │       │   ├── 📱 Sessions Today Card
│   │               │   │       │   │   ├── Smartphone icon + label
│   │               │   │       │   │   ├── Session count
│   │               │   │       │   │   └── App switches count
│   │               │   │       │   └── ⚠️ Active Alerts Card
│   │               │   │       │       ├── AlertTriangle icon + label
│   │               │   │       │       ├── Unread count (pulse animation)
│   │               │   │       │       └── Critical count
│   │               │   │       │
│   │               │   │       ├── Charts Row (grid: 2fr 1fr)
│   │               │   │       │   ├── 📈 Weekly Trends (Recharts AreaChart)
│   │               │   │       │   │   ├── Gradient fill under curve
│   │               │   │       │   │   ├── XAxis (week dates)
│   │               │   │       │   │   ├── YAxis (minutes)
│   │               │   │       │   │   └── Tooltip (custom dark theme)
│   │               │   │       │   │
│   │               │   │       │   └── 🍕 Platform Usage (Recharts PieChart)
│   │               │   │       │       ├── Donut chart (inner/outer radius)
│   │               │   │       │       ├── Labels (platform + minutes)
│   │               │   │       │       └── Color-coded cells
│   │               │   │       │
│   │               │   │       ├── Tracker Row (grid: 1fr 1fr)
│   │               │   │       │   ├── ⚡ Dopamine Trigger Tracker
│   │               │   │       │   │   └── Recharts RadarChart
│   │               │   │       │   │       ├── 6 axes (Duration, Frequency,
│   │               │   │       │   │       │   Continuity, App-Switching,
│   │               │   │       │   │       │   Temporal, Engagement)
│   │               │   │       │   │       ├── Filled polygon (purple)
│   │               │   │       │   │       └── Score values on each axis
│   │               │   │       │   │
│   │               │   │       │   └── 🟩 Usage Heatmap
│   │               │   │       │       ├── 7×24 grid (days × hours)
│   │               │   │       │       ├── Color intensity mapping
│   │               │   │       │       │   └── Transparent → Blue → Purple → Red
│   │               │   │       │       ├── Day labels (Mon-Sun)
│   │               │   │       │       ├── Hour labels (12a, 3a, 6a...)
│   │               │   │       │       └── Intensity legend (Less ▪▪▪▪▪ More)
│   │               │   │       │
│   │               │   │       └── Bottom Row (grid: 1fr 1fr)
│   │               │   │           ├── ❤️ Digital Recovery Progress
│   │               │   │           │   ├── Conic gradient progress ring
│   │               │   │           │   ├── Score / 100
│   │               │   │           │   ├── Trend message
│   │               │   │           │   └── Trend badge (improving/stable/worsening)
│   │               │   │           │
│   │               │   │           └── 💡 Personalized Recommendations
│   │               │   │               └── List of recommendation cards
│   │               │   │
│   │               │   ├── Route: /analytics
│   │               │   │   └── <Analytics />
│   │               │   │       ├── Header + Action Buttons
│   │               │   │       │   ├── "Run ML Prediction" button
│   │               │   │       │   └── "Re-train Model" button
│   │               │   │       │
│   │               │   │       ├── Prediction Results (grid: 3 columns)
│   │               │   │       │   ├── Risk Level Circle
│   │               │   │       │   │   ├── Radial gradient ring
│   │               │   │       │   │   ├── Confidence percentage
│   │               │   │       │   │   └── Risk badge
│   │               │   │       │   ├── Confidence Breakdown
│   │               │   │       │   │   └── Horizontal BarChart
│   │               │   │       │   └── Top Contributing Features
│   │               │   │       │       └── Progress bars with labels
│   │               │   │       │
│   │               │   │       └── BSMAS Score Trend
│   │               │   │           └── LineChart with threshold lines
│   │               │   │
│   │               │   ├── Route: /alerts
│   │               │   │   └── <Alerts />
│   │               │   │       ├── Header + "Mark All Read" button
│   │               │   │       ├── Summary Cards (Critical / Warning / Unread)
│   │               │   │       ├── Filter Tabs (All / Unread)
│   │               │   │       └── Alert List
│   │               │   │           └── AlertCard (for each alert)
│   │               │   │               ├── Severity icon (color-coded)
│   │               │   │               ├── Title + timestamp
│   │               │   │               ├── Message body
│   │               │   │               └── Dismiss button
│   │               │   │
│   │               │   ├── Route: /interventions
│   │               │   │   └── <Interventions />
│   │               │   │       ├── Focus Mode Card
│   │               │   │       │   ├── Duration selector (15/30/45/60/90 min)
│   │               │   │       │   ├── Start button
│   │               │   │       │   └── Active state (animated ring + timer)
│   │               │   │       ├── Risk Assessment Card
│   │               │   │       ├── Detox Activities Grid
│   │               │   │       │   └── Activity Card (emoji + name + duration)
│   │               │   │       └── Intervention History
│   │               │   │
│   │               │   └── Route: /assessment
│   │               │       └── <BSMASAssessment />
│   │               │           ├── Progress Bar (animated)
│   │               │           ├── Question Navigation Tabs (1-9)
│   │               │           ├── Question Card
│   │               │           │   ├── Category label
│   │               │           │   ├── Question text
│   │               │           │   └── Scale Options (1-5 with emojis)
│   │               │           │       ├── 😌 Very Rarely
│   │               │           │       ├── 🙂 Rarely
│   │               │           │       ├── 😐 Sometimes
│   │               │           │       ├── 😟 Often
│   │               │           │       └── 😰 Very Often
│   │               │           ├── Navigation (Previous / Next / Submit)
│   │               │           │
│   │               │           └── Results View (after submit)
│   │               │               ├── Score Ring (conic-gradient)
│   │               │               ├── Classification Badge
│   │               │               ├── Trend Indicator
│   │               │               └── Breakdown Grid (9 items)
│   │               │
│   │               └── <div className="bg-mesh" />  // Animated background
│   │
│   └── Shared Components
│       ├── glass-card              // Glassmorphism container
│       ├── badge (normal/at_risk/addicted)
│       ├── btn-primary / btn-secondary
│       ├── input-field
│       ├── skeleton (loading)
│       └── animate-fade-in / stagger-children
```

## Key Design Patterns

1. **Glassmorphism** — All cards use `backdrop-filter: blur()` with semi-transparent backgrounds
2. **Staggered Animations** — Children animate in sequence using CSS `animation-delay`
3. **Color-coded Risk** — Consistent green/yellow/red palette across all components
4. **Responsive Grids** — CSS Grid with `auto-fill` for flexible layouts
5. **Custom Chart Tooltips** — Dark-themed, rounded tooltips matching the design system
