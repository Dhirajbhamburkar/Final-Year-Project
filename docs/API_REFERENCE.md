# 📡 API Reference — SMADS

Base URL: `http://localhost:8000`

## Authentication

### `POST /api/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "age": 22
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": { "id": "...", "username": "john_doe", ... }
}
```

### `POST /api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### `GET /api/auth/profile` 🔒
Get authenticated user's profile.

### `PUT /api/auth/preferences` 🔒
Update user preferences (daily limits, notifications, etc.)

---

## Usage Data

### `POST /api/usage/log` 🔒
Submit a single usage log entry. Automatically triggers alert checks.

**Request Body:**
```json
{
  "platform": "instagram",
  "session_duration_minutes": 45.5,
  "session_start": "2026-02-23T09:44:30Z",
  "session_end": "2026-02-23T10:30:00Z",
  "app_switches": 12,
  "scroll_depth_percentage": 78.5,
  "interactions": {
    "likes": 23,
    "comments": 5,
    "shares": 2,
    "posts_viewed": 156
  },
  "device_type": "mobile"
}
```

### `POST /api/usage/log/batch` 🔒
Submit multiple usage logs in one request.

### `GET /api/usage/summary/daily?date=2026-02-23` 🔒
Get daily usage summary with addiction index, factor breakdown, and recommendations.

### `GET /api/usage/trends/weekly?weeks=4` 🔒
Get weekly trend data for longitudinal tracking.

### `GET /api/usage/heatmap?days=30` 🔒
Get hourly usage heatmap data (day_of_week × hour).

---

## Analytics & ML

### `GET /api/analytics/predict` 🔒
Run ML prediction on user's recent 7-day usage data.

### `POST /api/analytics/train` 🔒
Trigger model retraining on synthetic data.

### `POST /api/analytics/bsmas` 🔒
Submit a BSMAS self-assessment (9 questions, 1-5 each).

### `GET /api/analytics/bsmas/history` 🔒
Get BSMAS assessment history.

### `GET /api/analytics/recovery` 🔒
Get digital recovery progress score and trend.

---

## Alerts

### `GET /api/alerts/?unread_only=false&limit=20` 🔒
Get user alerts with summary counts.

### `PUT /api/alerts/{alert_id}/read` 🔒
Mark a single alert as read.

### `PUT /api/alerts/read-all` 🔒
Mark all alerts as read.

---

## Interventions

### `GET /api/interventions/suggestions` 🔒
Get intervention suggestions based on current risk level.

### `POST /api/interventions/focus-mode?duration=30` 🔒
Activate Focus Mode for specified duration (minutes).

### `PUT /api/interventions/focus-mode/{id}/complete` 🔒
Complete a Focus Mode session.

### `GET /api/interventions/history?limit=20` 🔒
Get intervention history.

---

🔒 = Requires `Authorization: Bearer <token>` header
