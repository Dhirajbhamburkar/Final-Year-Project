# 🧠 SMADS — Social Media Addiction Detection System

> **AI-Powered Digital Wellbeing Platform** | B.E. Final Year Project

An intelligent system that tracks, analyzes, and provides early warnings for unhealthy social media consumption patterns using Machine Learning and the Modified Bergen Social Media Addiction Scale (BSMAS).

---

## 📐 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Tailwind)                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Auth Page│  │ Dashboard    │  │ Dopamine   │  │ Focus Mode    │  │
│  │          │  │ (Recharts)   │  │ Tracker    │  │ Interventions │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └───────┬───────┘  │
│       └────────────────┴────────────────┴─────────────────┘          │
│                              │ REST API (JWT Auth)                    │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                      │
│  ┌──────────────┐  ┌────────┴───────┐  ┌──────────────────────────┐  │
│  │ Auth Module  │  │ Data Ingestion │  │ ML Inference Engine      │  │
│  │ (JWT/Bcrypt) │  │ (Usage Logs)   │  │ (Random Forest / GBM)   │  │
│  └──────────────┘  └────────────────┘  │ Modified BSMAS Scoring   │  │
│                                         └────────────┬─────────────┘  │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────┴─────────────┐  │
│  │ Alert Engine │  │ Smart          │  │ Addiction Index           │  │
│  │ (Real-time)  │  │ Interventions  │  │ Calculator               │  │
│  └──────────────┘  └────────────────┘  └──────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                  DATABASE (MongoDB Time-Series)                      │
│  ┌──────────────┐  ┌────────┴───────┐  ┌──────────────────────────┐  │
│  │ UserProfiles │  │ UsageLogs      │  │ AddictionAlerts          │  │
│  │              │  │ (Time-Series)  │  │                          │  │
│  └──────────────┘  └────────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌────────────────┐                                │
│  │ BSMASScores  │  │ Interventions  │                                │
│  └──────────────┘  └────────────────┘                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| **Frontend**   | React 18, Tailwind CSS, Recharts, React Router |
| **Backend**    | Python 3.11+, FastAPI, Uvicorn                |
| **ML/AI**      | scikit-learn (Random Forest, Gradient Boosting)|
| **Database**   | MongoDB 7+ (Time-Series Collections)          |
| **Auth**       | JWT (PyJWT) + Bcrypt (passlib)                |
| **Validation** | Pydantic v2                                   |

---

## 📁 Project Structure

```
SMADS/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── config.py                # Environment config
│   │   ├── database.py              # MongoDB connection
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User Pydantic models
│   │   │   ├── usage_log.py         # Usage log schemas
│   │   │   ├── alert.py             # Alert schemas
│   │   │   └── bsmas.py             # BSMAS score models
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Auth endpoints
│   │   │   ├── usage.py             # Usage data ingestion
│   │   │   ├── analytics.py         # Analytics & trends
│   │   │   ├── alerts.py            # Alert management
│   │   │   └── interventions.py     # Smart interventions
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py      # JWT + Bcrypt logic
│   │   │   ├── usage_service.py     # Usage data processing
│   │   │   ├── ml_engine.py         # ML inference engine
│   │   │   ├── alert_service.py     # Real-time alerts
│   │   │   ├── addiction_index.py   # Addiction scoring
│   │   │   └── intervention_service.py
│   │   └── ml/
│   │       ├── __init__.py
│   │       ├── train_model.py       # Model training script
│   │       ├── feature_engineering.py
│   │       └── model_artifacts/     # Saved models (.pkl)
│   ├── requirements.txt
│   ├── .env.example
│   └── seed_data.py                 # Database seeding script
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Dashboard/
│   │   │   ├── Auth/
│   │   │   ├── Charts/
│   │   │   └── Interventions/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── context/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_REFERENCE.md
│   └── COMPONENT_TREE.md
└── start.bat
```

---

## 🏃 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 7+ (running locally or Atlas URI)

### Setup
```bash
# Clone and navigate
cd SMADS

# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py

# Frontend (new terminal)
cd frontend
npm install

# Start both
cd ..
start.bat
```

---

## 📊 Key Features

1. **Usage Data Ingestion** — High-frequency tracking of screen time, sessions, and app-switching
2. **Addiction Detection Engine** — ML-based classification (Normal / At-Risk / Addicted)
3. **Real-time Warning System** — Automated alerts when safety thresholds are breached
4. **Longitudinal Tracking** — Daily, weekly, monthly trends with recovery progress
5. **Smart Interventions** — Digital Detox suggestions and Focus Mode triggers

---

## 📜 License

This project is developed as a B.E. Final Year Project for academic purposes.

## 📸 Project Screenshots

### Login Page
![Login Page](ScreenShots/login%20Page.png)

### Digital Wellness Dashboard
![Dashboard](ScreenShots/Digital%20wellness%20Dashboard.png)

### Analytics & ML Engine
![Analytics](ScreenShots/Analytics%20%26%20ML%20Engin.png)

### BSMAS Assessment
![BSMAS Assessment](ScreenShots/BSMAS%20Assessment.png)

### Smart Interventions
![Smart Interventions](ScreenShots/Smart%20Interventions.png)


## 👥 Team Members

- Dhiraj Bhamburkar
- Gaurav Mehere
- Rahul Pawar

### Contributions

- Dhiraj Bhamburkar – Frontend Development / GitHub Management
- Gaurav Mehere – Machine Learning Module / Backend Integration
- Rahul Pawar – Database Design & Testing

  
