"""
ML Inference Engine
Random Forest & Gradient Boosting classifiers for addiction detection
based on the Modified Bergen Social Media Addiction Scale (BSMAS).

The engine:
1. Trains on synthetic + real usage data
2. Engineers features from raw usage logs
3. Classifies users into: Normal, At-Risk, Addicted
4. Provides prediction confidence and explainability
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from app.utils.time_utils import now_ist
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Model artifacts directory
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "model_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

# Classification labels
RISK_LABELS = {0: "normal", 1: "at_risk", 2: "addicted"}
RISK_LABELS_REVERSE = {v: k for k, v in RISK_LABELS.items()}

# Feature names for the ML model
FEATURE_NAMES = [
    "avg_daily_screen_time_min",
    "avg_session_duration_min",
    "sessions_per_day",
    "avg_app_switches_per_session",
    "max_continuous_session_min",
    "late_night_session_ratio",
    "avg_scroll_depth",
    "total_interactions_per_day",
    "bsmas_salience",
    "bsmas_tolerance",
    "bsmas_mood_modification",
    "bsmas_relapse",
    "bsmas_withdrawal",
    "bsmas_conflict",
    "bsmas_sleep_impact",
    "bsmas_fomo",
    "bsmas_comparison",
    "weekend_usage_ratio",
    "usage_variance",
    "dopamine_trigger_score",
]


class AddictionDetectionEngine:
    """
    ML-powered addiction detection using ensemble classifiers.
    
    Usage:
        engine = AddictionDetectionEngine()
        engine.train()  # Train on synthetic data
        
        prediction = engine.predict({
            "avg_daily_screen_time_min": 320,
            "sessions_per_day": 18,
            ...
        })
    """

    def __init__(self, model_type: str = "random_forest"):
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self._load_or_init_model()

    def _load_or_init_model(self):
        """Load saved model or initialize a new one."""
        model_path = os.path.join(MODEL_DIR, f"{self.model_type}_model.pkl")
        scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.is_trained = True
            print(f"[ML] Loaded pre-trained {self.model_type} model")
        else:
            self._init_model()

    def _init_model(self):
        """Initialize a fresh ML model."""
        if self.model_type == "random_forest":
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == "gradient_boosting":
            self.model = GradientBoostingClassifier(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

    def generate_synthetic_training_data(self, n_samples: int = 3000) -> pd.DataFrame:
        """
        Generate labeled synthetic training data based on BSMAS-derived profiles.
        
        This creates realistic usage patterns for three risk categories:
        - Normal (40%): Healthy social media usage
        - At-Risk (35%): Showing early warning signs
        - Addicted (25%): Meeting BSMAS addiction criteria
        """
        np.random.seed(42)
        data = []

        profiles = {
            "normal": {
                "ratio": 0.40,
                "screen_time": (30, 180),
                "session_dur": (5, 30),
                "sessions": (2, 12),
                "app_switches": (1, 5),
                "max_cont": (10, 60),
                "late_ratio": (0, 0.1),
                "scroll": (10, 50),
                "interactions": (5, 50),
                "bsmas_range": (1, 2.5),
                "weekend_ratio": (0.8, 1.3),
                "variance": (5, 30),
                "dopamine": (5, 30),
            },
            "at_risk": {
                "ratio": 0.35,
                "screen_time": (150, 360),
                "session_dur": (20, 75),
                "sessions": (10, 25),
                "app_switches": (4, 15),
                "max_cont": (45, 180),
                "late_ratio": (0.05, 0.3),
                "scroll": (40, 75),
                "interactions": (30, 120),
                "bsmas_range": (2.5, 4),
                "weekend_ratio": (1.2, 1.8),
                "variance": (20, 60),
                "dopamine": (30, 65),
            },
            "addicted": {
                "ratio": 0.25,
                "screen_time": (300, 720),
                "session_dur": (50, 180),
                "sessions": (20, 50),
                "app_switches": (10, 30),
                "max_cont": (120, 400),
                "late_ratio": (0.2, 0.6),
                "scroll": (65, 98),
                "interactions": (80, 300),
                "bsmas_range": (3.5, 5),
                "weekend_ratio": (1.5, 2.5),
                "variance": (40, 100),
                "dopamine": (55, 100),
            },
        }

        for label_name, profile in profiles.items():
            n = int(n_samples * profile["ratio"])
            label = RISK_LABELS_REVERSE[label_name]

            for _ in range(n):
                bsmas_base = np.random.uniform(*profile["bsmas_range"])
                row = {
                    "avg_daily_screen_time_min": np.random.uniform(*profile["screen_time"]),
                    "avg_session_duration_min": np.random.uniform(*profile["session_dur"]),
                    "sessions_per_day": np.random.randint(*profile["sessions"]),
                    "avg_app_switches_per_session": np.random.uniform(*profile["app_switches"]),
                    "max_continuous_session_min": np.random.uniform(*profile["max_cont"]),
                    "late_night_session_ratio": np.random.uniform(*profile["late_ratio"]),
                    "avg_scroll_depth": np.random.uniform(*profile["scroll"]),
                    "total_interactions_per_day": np.random.uniform(*profile["interactions"]),
                    "bsmas_salience": int(np.clip(bsmas_base + np.random.normal(0, 0.5), 1, 5)),
                    "bsmas_tolerance": int(np.clip(bsmas_base + np.random.normal(0, 0.5), 1, 5)),
                    "bsmas_mood_modification": int(np.clip(bsmas_base + np.random.normal(0, 0.6), 1, 5)),
                    "bsmas_relapse": int(np.clip(bsmas_base + np.random.normal(0, 0.5), 1, 5)),
                    "bsmas_withdrawal": int(np.clip(bsmas_base + np.random.normal(0, 0.5), 1, 5)),
                    "bsmas_conflict": int(np.clip(bsmas_base + np.random.normal(0, 0.7), 1, 5)),
                    "bsmas_sleep_impact": int(np.clip(bsmas_base + np.random.normal(0, 0.6), 1, 5)),
                    "bsmas_fomo": int(np.clip(bsmas_base + np.random.normal(0, 0.5), 1, 5)),
                    "bsmas_comparison": int(np.clip(bsmas_base + np.random.normal(0, 0.6), 1, 5)),
                    "weekend_usage_ratio": np.random.uniform(*profile["weekend_ratio"]),
                    "usage_variance": np.random.uniform(*profile["variance"]),
                    "dopamine_trigger_score": np.random.uniform(*profile["dopamine"]),
                    "label": label,
                }
                data.append(row)

        df = pd.DataFrame(data)
        return df.sample(frac=1, random_state=42).reset_index(drop=True)

    def train(self, data: Optional[pd.DataFrame] = None) -> Dict:
        """
        Train the addiction detection model.
        
        Args:
            data: Optional training DataFrame. If None, uses synthetic data.
        
        Returns:
            Training metrics dictionary
        """
        if data is None:
            data = self.generate_synthetic_training_data()

        X = data[FEATURE_NAMES].values
        y = data["label"].values

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True

        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, target_names=list(RISK_LABELS.values()), output_dict=True)

        # Cross-validation
        cv_scores = cross_val_score(self.model, self.scaler.transform(X), y, cv=5, scoring="accuracy")

        # Save model
        self._save_model()

        # Feature importance
        if hasattr(self.model, "feature_importances_"):
            importances = dict(zip(FEATURE_NAMES, self.model.feature_importances_.tolist()))
            importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
        else:
            importances = {}

        metrics = {
            "model_type": self.model_type,
            "accuracy": round(accuracy, 4),
            "cv_mean_accuracy": round(cv_scores.mean(), 4),
            "cv_std": round(cv_scores.std(), 4),
            "classification_report": report,
            "feature_importances": importances,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "trained_at": now_ist().isoformat(),
        }

        print(f"[ML] Model trained -- Accuracy: {accuracy:.2%}, CV Mean: {cv_scores.mean():.2%}")
        return metrics

    def predict(self, features: Dict) -> Dict:
        """
        Predict addiction risk level for a user.
        
        Args:
            features: Dictionary mapping feature names to values
        
        Returns:
            Prediction result with confidence scores
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call engine.train() first.")

        # Build feature vector
        feature_vector = np.array([
            features.get(name, 0) for name in FEATURE_NAMES
        ]).reshape(1, -1)

        # Scale
        feature_vector_scaled = self.scaler.transform(feature_vector)

        # Predict
        prediction = self.model.predict(feature_vector_scaled)[0]
        probabilities = self.model.predict_proba(feature_vector_scaled)[0]

        risk_level = RISK_LABELS[prediction]
        confidence = {
            RISK_LABELS[i]: round(float(prob), 4)
            for i, prob in enumerate(probabilities)
        }

        # Top contributing features
        if hasattr(self.model, "feature_importances_"):
            feature_contributions = sorted(
                zip(FEATURE_NAMES, self.model.feature_importances_),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        else:
            feature_contributions = []

        return {
            "risk_level": risk_level,
            "confidence": confidence,
            "primary_confidence": round(float(max(probabilities)), 4),
            "top_contributing_features": [
                {"feature": name, "importance": round(float(imp), 4)}
                for name, imp in feature_contributions
            ],
            "predicted_at": now_ist().isoformat(),
        }

    def _save_model(self):
        """Save model and scaler to disk."""
        model_path = os.path.join(MODEL_DIR, f"{self.model_type}_model.pkl")
        scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        print(f"[ML] Model saved to {MODEL_DIR}")


# ── Feature Engineering Utilities ──

def engineer_features_from_logs(
    usage_logs: List[Dict],
    bsmas_scores: Optional[Dict] = None
) -> Dict:
    """
    Transform raw usage logs into ML feature vectors.

    Args:
        usage_logs: List of usage log documents from MongoDB
        bsmas_scores: Latest BSMAS assessment responses

    Returns:
        Feature dictionary compatible with engine.predict()
    """
    if not usage_logs:
        return {name: 0 for name in FEATURE_NAMES}

    df = pd.DataFrame(usage_logs)

    total_screen_time = df["session_duration_minutes"].sum()
    session_count = len(df)
    avg_session_duration = df["session_duration_minutes"].mean()
    max_continuous = df["session_duration_minutes"].max()
    avg_app_switches = df["app_switches"].mean() if "app_switches" in df else 0
    avg_scroll = df["scroll_depth_percentage"].mean() if "scroll_depth_percentage" in df else 0

    # Late night ratio
    if "session_start" in df.columns:
        df["hour"] = pd.to_datetime(df["session_start"]).dt.hour
        late_sessions = df[(df["hour"] >= 0) & (df["hour"] < 5)]
        late_ratio = len(late_sessions) / max(session_count, 1)
    else:
        late_ratio = 0

    # Interaction count
    total_interactions = 0
    if "interactions" in df.columns:
        for _, row in df.iterrows():
            if isinstance(row.get("interactions"), dict):
                total_interactions += sum(row["interactions"].values())

    # BSMAS scores (default to middle if not provided)
    bsmas = bsmas_scores or {}
    bsmas_defaults = {
        "salience": 1, "tolerance": 1, "mood_modification": 1,
        "relapse": 1, "withdrawal": 1, "conflict": 1,
        "sleep_impact": 1, "fomo": 1, "comparison": 1
    }
    for key in bsmas_defaults:
        if key not in bsmas:
            bsmas[key] = bsmas_defaults[key]

    # Weekend usage ratio (placeholder)
    weekend_ratio = 1.0

    # Usage variance 
    usage_variance = df["session_duration_minutes"].std() if len(df) > 1 else 0

    # Dopamine trigger score (composite of scroll + interactions + frequency)
    dopamine = (
        avg_scroll * 0.3 +
        min(total_interactions / max(session_count, 1), 100) * 0.3 +
        min(session_count / 50, 1) * 100 * 0.4
    )

    return {
        "avg_daily_screen_time_min": total_screen_time,
        "avg_session_duration_min": avg_session_duration,
        "sessions_per_day": session_count,
        "avg_app_switches_per_session": avg_app_switches,
        "max_continuous_session_min": max_continuous,
        "late_night_session_ratio": late_ratio,
        "avg_scroll_depth": avg_scroll,
        "total_interactions_per_day": total_interactions,
        "bsmas_salience": bsmas["salience"],
        "bsmas_tolerance": bsmas["tolerance"],
        "bsmas_mood_modification": bsmas["mood_modification"],
        "bsmas_relapse": bsmas["relapse"],
        "bsmas_withdrawal": bsmas["withdrawal"],
        "bsmas_conflict": bsmas["conflict"],
        "bsmas_sleep_impact": bsmas["sleep_impact"],
        "bsmas_fomo": bsmas["fomo"],
        "bsmas_comparison": bsmas["comparison"],
        "weekend_usage_ratio": weekend_ratio,
        "usage_variance": usage_variance,
        "dopamine_trigger_score": dopamine,
    }


# ── Singleton engine instance ──
_engine_instance: Optional[AddictionDetectionEngine] = None


def get_ml_engine() -> AddictionDetectionEngine:
    """Get or create the singleton ML engine instance."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = AddictionDetectionEngine(model_type="random_forest")
    return _engine_instance
