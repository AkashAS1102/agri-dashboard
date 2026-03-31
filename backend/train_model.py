"""
train_model.py
--------------
Step 1: Generate synthetic agricultural data and train a Random Forest classifier.
        Exports the trained model to model.pkl for use by the FastAPI backend.

Crops mapped to typical N, P, K, pH conditions:
  - Rice:   High N, moderate P/K, pH 5.5–7.0
  - Wheat:  Moderate N, high P, pH 6.0–7.5
  - Maize:  High N, moderate P, high K, pH 5.8–7.5
  - Cotton: Low N, high P, moderate K, pH 6.0–8.0
  - Jute:   High N, low P, low K, pH 6.0–7.5
"""

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

np.random.seed(42)

# ── Helper to generate samples per crop ────────────────────────────────────────
def generate_samples(n, n_range, p_range, k_range, ph_range, label):
    N   = np.random.uniform(*n_range,  n)
    P   = np.random.uniform(*p_range,  n)
    K   = np.random.uniform(*k_range,  n)
    pH  = np.random.uniform(*ph_range, n)
    labels = np.array([label] * n)
    return np.column_stack([N, P, K, pH]), labels

# ── Generate synthetic data for 5 crops ───────────────────────────────────────
samples = [
    generate_samples(400, (60, 120), (30,  60),  (20, 50),  (5.5, 7.0), "Rice"),
    generate_samples(400, (40,  90), (60, 100),  (40, 70),  (6.0, 7.5), "Wheat"),
    generate_samples(400, (70, 130), (40,  80),  (60, 90),  (5.8, 7.5), "Maize"),
    generate_samples(400, (20,  55), (70, 120),  (30, 60),  (6.0, 8.0), "Cotton"),
    generate_samples(400, (75, 140), (10,  40),  (10, 35),  (6.0, 7.5), "Jute"),
]

X = np.vstack([s[0] for s in samples])
y = np.concatenate([s[1] for s in samples])

# ── Encode labels ──────────────────────────────────────────────────────────────
le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)

# ── Train Random Forest ────────────────────────────────────────────────────────
model = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42)
model.fit(X_train, y_train)

print("=== Model Performance ===")
print(classification_report(y_test, model.predict(X_test), target_names=le.classes_))

# ── Export model + encoder together ───────────────────────────────────────────
joblib.dump({"model": model, "label_encoder": le}, "model.pkl")
print("model.pkl saved successfully!")
print(f"Classes: {list(le.classes_)}")
