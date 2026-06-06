# 🗄️ Database Design — SMADS

## MongoDB Collections Overview

| Collection | Type | Purpose |
|---|---|---|
| `user_profiles` | Standard | User accounts, preferences, risk levels |
| `usage_logs` | **Time-Series** | High-frequency session telemetry data |
| `addiction_alerts` | Standard | Generated warnings and notifications |
| `bsmas_scores` | Standard | Bergen Scale self-assessment results |
| `interventions` | Standard | Focus Mode sessions and detox activities |

---

## Collection Schemas

### 1. `user_profiles`

```json
{
  "_id": ObjectId("65a1b2c3d4e5f6a7b8c9d0e1"),
  "username": "john_doe",
  "email": "john@example.com",
  "password_hash": "$2b$12$LJ3m4x...",
  "full_name": "John Doe",
  "age": 22,
  "current_risk_level": "at_risk",         // "normal" | "at_risk" | "addicted"
  "current_addiction_index": 58.7,          // 0.0 - 100.0
  "total_screen_time_today_minutes": 245.5,
  "preferences": {
    "daily_limit_minutes": 240,             // User-configurable
    "continuous_limit_minutes": 180,
    "enable_push_notifications": true,
    "enable_focus_mode": true,
    "detox_reminder_interval_hours": 2,
    "preferred_detox_activities": ["mindfulness", "walking", "reading"]
  },
  "created_at": ISODate("2026-01-15T10:30:00Z"),
  "updated_at": ISODate("2026-02-23T06:00:00Z"),
  "last_active_at": ISODate("2026-02-23T06:09:00Z")
}
```

**Indexes:**
- `{ email: 1 }` — unique
- `{ username: 1 }` — unique

---

### 2. `usage_logs` (⏰ Time-Series Collection)

```json
{
  "timestamp": ISODate("2026-02-23T10:30:00Z"),     // timeField
  "user_id": "65a1b2c3d4e5f6a7b8c9d0e1",           // metaField
  "platform": "instagram",                           // Platform enum
  "session_duration_minutes": 45.5,
  "session_start": ISODate("2026-02-23T09:44:30Z"),
  "session_end": ISODate("2026-02-23T10:30:00Z"),
  "app_switches": 12,                                // Times user switched apps
  "scroll_depth_percentage": 78.5,                    // How far they scrolled
  "interactions": {
    "likes": 23,
    "comments": 5,
    "shares": 2,
    "posts_viewed": 156
  },
  "is_continuous": false,                             // Session > 3 hours?
  "device_type": "mobile"                             // "mobile" | "desktop" | "tablet"
}
```

**Time-Series Configuration:**
```javascript
db.createCollection("usage_logs", {
  timeseries: {
    timeField: "timestamp",
    metaField: "user_id",
    granularity: "minutes"
  },
  expireAfterSeconds: 31536000  // 1-year retention
});
```

**Indexes:**
- Auto-created by time-series engine on `timestamp`
- `{ user_id: 1, timestamp: -1 }` — compound for user queries

---

### 3. `addiction_alerts`

```json
{
  "_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d1"),
  "user_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "alert_type": "continuous_usage",
  "severity": "warning",                    // "info" | "warning" | "critical"
  "title": "⏰ Extended Session Detected",
  "message": "You've been on Instagram for 195 minutes continuously...",
  "metadata": {
    "session_duration_minutes": 195,
    "platform": "instagram",
    "current_addiction_index": 72.5,
    "threshold": 180
  },
  "is_read": false,
  "is_dismissed": false,
  "action_taken": null,
  "created_at": ISODate("2026-02-23T06:15:00Z"),
  "read_at": null
}
```

**Alert Types:**
| Type | Trigger Condition |
|---|---|
| `continuous_usage` | Session ≥ 180 minutes (3 hours) |
| `daily_limit` | Daily total ≥ user's daily limit |
| `ai_warning` | Addiction Index ≥ 65 |
| `ai_critical` | Addiction Index ≥ 85 |
| `high_frequency` | Sessions/day ≥ 25 |
| `late_night` | Usage between 12:00 AM – 5:00 AM |
| `bsmas_escalation` | BSMAS score increase > 3 points |

**Indexes:**
- `{ user_id: 1, created_at: -1 }` — recent alerts per user
- `{ is_read: 1 }` — unread filter

---

### 4. `bsmas_scores`

```json
{
  "_id": ObjectId("65g2b3c4d5e6f7a8b9c0d1e2"),
  "user_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "responses": {
    "salience": 4,              // 1-5 scale
    "tolerance": 3,
    "mood_modification": 5,
    "relapse": 4,
    "withdrawal": 3,
    "conflict": 2,
    "sleep_impact": 4,          // Extended item
    "fomo": 3,                  // Extended item
    "comparison": 4             // Extended item
  },
  "total_score": 32,           // Sum of all responses
  "max_score": 45,             // 9 items × 5
  "percentage": 71.1,          // (32/45) × 100
  "classification": "at_risk", // Based on percentage thresholds
  "assessed_at": ISODate("2026-02-23T08:00:00Z"),
  "notes": "Weekly self-assessment"
}
```

**Classification Thresholds:**
| Percentage | Classification |
|---|---|
| 0% – 49.9% | Normal ✅ |
| 50% – 74.9% | At Risk ⚠️ |
| 75% – 100% | Addicted 🚨 |

**Indexes:**
- `{ user_id: 1, assessed_at: -1 }` — latest score per user

---

### 5. `interventions`

```json
{
  "_id": ObjectId("65h3c4d5e6f7a8b9c0d1e2f3"),
  "user_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "type": "focus_mode",
  "duration_minutes": 30,
  "started_at": ISODate("2026-02-23T10:00:00Z"),
  "ends_at": ISODate("2026-02-23T10:30:00Z"),
  "completed": true,
  "completed_at": ISODate("2026-02-23T10:28:00Z"),
  "triggered_at": ISODate("2026-02-23T10:00:00Z")
}
```

**Indexes:**
- `{ user_id: 1, triggered_at: -1 }` — intervention history

---

## Aggregation Pipeline Examples

### Daily Usage Summary
```javascript
db.usage_logs.aggregate([
  { $match: { user_id: "...", timestamp: { $gte: today, $lt: tomorrow } } },
  { $group: {
      _id: null,
      total_screen_time: { $sum: "$session_duration_minutes" },
      total_sessions: { $sum: 1 },
      total_app_switches: { $sum: "$app_switches" },
      avg_session: { $avg: "$session_duration_minutes" },
      max_session: { $max: "$session_duration_minutes" },
      platforms: { $addToSet: "$platform" }
  }}
]);
```

### Usage Heatmap (Day × Hour)
```javascript
db.usage_logs.aggregate([
  { $match: { user_id: "...", timestamp: { $gte: thirtyDaysAgo } } },
  { $addFields: {
      day_of_week: { $dayOfWeek: "$session_start" },
      hour: { $hour: "$session_start" }
  }},
  { $group: {
      _id: { day: "$day_of_week", hour: "$hour" },
      total_minutes: { $sum: "$session_duration_minutes" },
      session_count: { $sum: 1 }
  }},
  { $sort: { "_id.day": 1, "_id.hour": 1 } }
]);
```
