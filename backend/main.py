"""
main.py
-------
Step 2: FastAPI backend.
  - Loads model.pkl (Random Forest + LabelEncoder exported by train_model.py)
  - Exposes POST /predict  →  returns recommended crop
  - CORS enabled so the Vite dev server (localhost:5173) can call it freely
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Predictive Agriculture API",
    description="Crop recommendation engine powered by a Random Forest model.",
    version="1.0.0",
)

# ── CORS – allow all origins in dev; tighten in production ────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load the trained model bundle on startup ───────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

try:
    bundle = joblib.load(MODEL_PATH)
    model: object = bundle["model"]
    label_encoder = bundle["label_encoder"]
    print(f"model.pkl loaded. Classes: {list(label_encoder.classes_)}")
except FileNotFoundError:
    model = None
    label_encoder = None
    print("model.pkl not found - run train_model.py first!")


# ── Request / Response schemas ─────────────────────────────────────────────────
class SoilInput(BaseModel):
    nitrogen: float   = Field(..., ge=0, le=200, example=90, description="Soil Nitrogen (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=200, example=45, description="Soil Phosphorus (kg/ha)")
    potassium: float  = Field(..., ge=0, le=200, example=40, description="Soil Potassium (kg/ha)")
    ph: float         = Field(..., ge=0, le=14,  example=6.5, description="Soil pH")
    location: str     = Field(..., example="Tamil Nadu", description="Farm location (metadata)")


class PredictionResponse(BaseModel):
    predicted_crop: str
    confidence: float          # probability of the top class (0–1)
    location: str
    all_probabilities: dict[str, float]


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Predictive Agriculture API is running 🌾"}


# ── Predict endpoint ──────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(soil: SoilInput):
    """
    Accept soil metrics and return the best-fit crop recommendation.

    ML Integration:
      1. Feature vector  →  [N, P, K, pH]
      2. model.predict_proba()  →  probability array across all classes
      3. LabelEncoder.inverse_transform()  →  human-readable crop name
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please run train_model.py first."
        )

    # Build feature vector in the same order used during training: N, P, K, pH
    features = np.array([[soil.nitrogen, soil.phosphorus, soil.potassium, soil.ph]])

    # Get class probabilities
    proba = model.predict_proba(features)[0]                  # shape: (n_classes,)
    top_idx = int(np.argmax(proba))
    predicted_crop = label_encoder.inverse_transform([top_idx])[0]
    confidence = float(proba[top_idx])

    # Build a full probability dict for the frontend
    all_probs = {
        label_encoder.inverse_transform([i])[0]: round(float(p), 4)
        for i, p in enumerate(proba)
    }

    return PredictionResponse(
        predicted_crop=predicted_crop,
        confidence=round(confidence, 4),
        location=soil.location,
        all_probabilities=all_probs,
    )
