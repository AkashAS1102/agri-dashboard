# AgroSense – Predictive Agriculture Dashboard

> AI-powered crop recommendation, weather forecasting, disease scanning and live market prices.

---

## 📁 Project Structure

```
agri-dashboard/
├── backend/
│   ├── main.py           # FastAPI server with /predict endpoint
│   ├── train_model.py    # ML training script (Random Forest)
│   ├── requirements.txt  # Python dependencies
│   └── model.pkl         # Generated after running train_model.py
├── src/
│   ├── App.tsx           # Complete single-file React dashboard
│   ├── supabase.ts       # Supabase client + savePredictionHistory()
│   ├── main.tsx          # React entry point
│   └── index.css         # Tailwind v4 + custom styles
├── .env.example          # Copy to .env and fill your keys
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

## 🚀 Quick Start

### Step 1 – Frontend

```bash
cd agri-dashboard
cp .env.example .env        # Fill in your Supabase keys
npm install
npm run dev                 # → http://localhost:5173
```

### Step 2 – Python Backend

```bash
cd backend

# Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Train the model first (generates model.pkl)
python train_model.py

# Start the API server
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Step 3 – Supabase (optional but recommended)

1. Create a free project at <https://supabase.com>
2. Run this SQL to create the history table:

```sql
create table search_history (
  id            uuid primary key default uuid_generate_v4(),
  location      text,
  predicted_crop text,
  created_at    timestamptz default now()
);
```

3. Copy **Project URL** and **anon key** into your `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌍 Localization | English / Tamil / Malayalam – live toggle |
| ⚠️ Alert Banner | Animated weather warning banner |
| 🌤 Weather Widget | Temp, Humidity, Wind Speed |
| 📈 Rainfall Chart | 7-day area chart (Recharts) |
| 🌿 Disease Scanner | Drag-and-drop image → simulated AI scan |
| 📊 Market Prices | 5 crops with up/down trend indicators |
| 🌾 Crop Engine | N/P/K/pH form → FastAPI → Random Forest prediction |
| 🔁 Offline Fallback | Local mock prediction if API is unreachable |
| 🗃 Supabase | Saves every prediction to `search_history` |
| 📜 History Log | Last 5 predictions shown in session |

---

## 🧠 ML Model

- **Algorithm**: Random Forest (150 trees, max_depth=10)
- **Features**: N, P, K (kg/ha), Soil pH
- **Classes**: Rice · Wheat · Maize · Cotton · Jute
- **Training data**: 2,000 synthetic samples (400 per crop)
- **Performance**: ~98% accuracy on held-out test set

---

## 🌐 API Reference

```
POST http://localhost:8000/predict
Content-Type: application/json

{
  "nitrogen":   90,
  "phosphorus": 45,
  "potassium":  40,
  "ph":         6.5,
  "location":   "Madurai, Tamil Nadu"
}
```

**Response:**
```json
{
  "predicted_crop": "Rice",
  "confidence": 0.92,
  "location": "Madurai, Tamil Nadu",
  "all_probabilities": {
    "Cotton": 0.01,
    "Jute":   0.02,
    "Maize":  0.05,
    "Rice":   0.92,
    "Wheat":  0.00
  }
}
```

---

## 🔑 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `VITE_API_URL` | FastAPI base URL (default: `http://localhost:8000`) |
