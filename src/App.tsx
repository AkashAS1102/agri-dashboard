// src/App.tsx
// =============================================================================
// Predictive Agriculture & Crop Dashboard
// Full single-file React + TypeScript implementation
//
// Features:
//   - Supabase Auth gate → LoginPage
//   - Localization (EN/TA/ML)
//   - Weather Widget, 7-Day Rainfall Chart (Recharts)
//   - Crop Disease Scanner powered by Groq Vision AI (meta-llama-4-scout)
//   - Live Market Prices widget
//   - Crop Recommendation Engine (FastAPI Random Forest + offline fallback)
//   - Supabase search_history persistence
// =============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Leaf, Thermometer, Droplets, Wind, AlertTriangle, TrendingUp, TrendingDown,
  Upload, Loader2, CheckCircle2, CloudRain, Sprout, ShoppingCart, History,
  Sun, Globe, LogOut, ShieldAlert, Info, Zap,
} from "lucide-react";
import { supabase, savePredictionHistory } from "./supabase";
import LoginPage from "./LoginPage";

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOCALIZATION
// ─────────────────────────────────────────────────────────────────────────────
type Lang = "en" | "ta" | "ml";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    appName: "AgroSense Dashboard",
    tagline: "AI-Powered Predictive Agriculture Platform",
    alertTitle: "⚠️ Important Alerts",
    alertMsg: "Heavy rainfall expected in coastal Karnataka & Tamil Nadu. Protect standing crops.",
    weatherWidget: "Live Weather",
    temp: "Temperature",
    humidity: "Humidity",
    wind: "Wind Speed",
    rainfallChart: "7-Day Rainfall Forecast",
    diseaseScanner: "Crop Disease Scanner (AI)",
    dropHint: "Drag & drop a crop photo or click to upload",
    scanHint: "Upload a clear image of the plant leaf for AI diagnosis",
    scanning: "Analyzing with Groq Vision AI…",
    scanResult: "Scan complete",
    scanNoKey: "Add VITE_GROQ_API_KEY to .env to enable AI scanning",
    marketPrices: "Live Market Prices",
    cropEngine: "Crop Recommendation Engine",
    nitrogen: "Nitrogen (N) kg/ha",
    phosphorus: "Phosphorus (P) kg/ha",
    potassium: "Potassium (K) kg/ha",
    ph: "Soil pH",
    location: "Location / District",
    predict: "Get Crop Recommendation",
    predicting: "Analyzing Soil…",
    result: "Recommended Crop",
    confidence: "Confidence",
    history: "Search History",
    fallbackNote: "⚡ Offline mode — result based on local model",
    logout: "Sign Out",
    healthy: "Healthy",
    diseased: "Disease Detected",
    severity: "Severity",
    symptoms: "Symptoms",
    treatment: "Recommended Treatment",
  },
  ta: {
    appName: "அக்ரோசென்ஸ் டாஷ்போர்டு",
    tagline: "AI-சார்ந்த முன்கணிப்பு விவசாய தளம்",
    alertTitle: "⚠️ முக்கியமான எச்சரிக்கைகள்",
    alertMsg: "கடலோர கர்நாடகா & தமிழ்நாட்டில் கனமழை எதிர்பார்க்கப்படுகிறது.",
    weatherWidget: "நேரடி வானிலை",
    temp: "வெப்பநிலை",
    humidity: "ஈரப்பதம்",
    wind: "காற்று வேகம்",
    rainfallChart: "7-நாள் மழை முன்னறிவிப்பு",
    diseaseScanner: "பயிர் நோய் ஸ்கேனர் (AI)",
    dropHint: "பயிர் புகைப்படத்தை இழுத்து விடுங்கள்",
    scanHint: "AI நோயறிதலுக்கு தாவர இலையின் தெளிவான படத்தை பதிவேற்றவும்",
    scanning: "Groq Vision AI மூலம் பகுப்பாய்வு செய்கிறது…",
    scanResult: "ஸ்கேன் முடிந்தது",
    scanNoKey: "AI ஸ்கேனிங்கை இயக்க .env-ல் VITE_GROQ_API_KEY சேர்க்கவும்",
    marketPrices: "நேரடி சந்தை விலைகள்",
    cropEngine: "பயிர் பரிந்துரை இயந்திரம்",
    nitrogen: "நைட்ரஜன் (N)",
    phosphorus: "பாஸ்பரஸ் (P)",
    potassium: "பொட்டாசியம் (K)",
    ph: "மண் pH",
    location: "இடம் / மாவட்டம்",
    predict: "பயிர் பரிந்துரை பெறுக",
    predicting: "மண்ணை பகுப்பாய்வு செய்கிறது…",
    result: "பரிந்துரைக்கப்பட்ட பயிர்",
    confidence: "நம்பகத்தன்மை",
    history: "தேடல் வரலாறு",
    fallbackNote: "⚡ ஆஃப்லைன் முறை — உள்ளூர் மாதிரியின் முடிவு",
    logout: "வெளியேறு",
    healthy: "ஆரோக்கியமானது",
    diseased: "நோய் கண்டறியப்பட்டது",
    severity: "தீவிரத்தன்மை",
    symptoms: "அறிகுறிகள்",
    treatment: "பரிந்துரைக்கப்படும் சிகிச்சை",
  },
  ml: {
    appName: "അഗ്രോസെൻസ് ഡാഷ്‌ബോർഡ്",
    tagline: "AI-ശക്തിയുള്ള പ്രവചനാത്മക കൃഷി പ്ലാറ്റ്ഫോം",
    alertTitle: "⚠️ പ്രധാന അലേർട്ടുകൾ",
    alertMsg: "തീരദേശ കർണാടക & തമിഴ്‌നാട്ടിൽ കനത്ത മഴ പ്രതീക്ഷിക്കുന്നു.",
    weatherWidget: "തൽസമയ കാലാവസ്ഥ",
    temp: "താപനില",
    humidity: "ആർദ്രത",
    wind: "കാറ്റിന്റെ വേഗം",
    rainfallChart: "7-ദിവസ മഴ പ്രവചനം",
    diseaseScanner: "വിള രോഗ സ്കാനർ (AI)",
    dropHint: "ഒരു വിള ഫോട്ടോ ഡ്രാഗ് ചെയ്‌ത് ഡ്രോപ്പ് ചെയ്യുക",
    scanHint: "AI രോഗ നിർണ്ണയത്തിനായി സസ്യ ഇലയുടെ വ്യക്തമായ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക",
    scanning: "Groq Vision AI ഉപയോഗിച്ച് വിശകലനം ചെയ്യുന്നു…",
    scanResult: "സ്കാൻ പൂർത്തിയായി",
    scanNoKey: "AI സ്കാനിംഗ് പ്രവർത്തനക്ഷമമാക്കാൻ .env-ൽ VITE_GROQ_API_KEY ചേർക്കുക",
    marketPrices: "തൽസമയ വിപണി വിലകൾ",
    cropEngine: "വിള ശുപാർശ എഞ്ചിൻ",
    nitrogen: "നൈട്രജൻ (N)",
    phosphorus: "ഫോസ്ഫറസ് (P)",
    potassium: "പൊട്ടാസ്യം (K)",
    ph: "മണ്ണ് pH",
    location: "സ്ഥലം / ജില്ല",
    predict: "വിള ശുപാർശ നേടുക",
    predicting: "മണ്ണ് വിശകലനം ചെയ്യുന്നു…",
    result: "ശുപാർശ ചെയ്ത വിള",
    confidence: "വിശ്വാസ്യത",
    history: "തിരയൽ ചരിത്രം",
    fallbackNote: "⚡ ഓഫ്‌ലൈൻ മോഡ് — ലോക്കൽ മോഡൽ ഫലം",
    logout: "സൈൻ ഔട്ട്",
    healthy: "ആരോഗ്യകരം",
    diseased: "രോഗം കണ്ടെത്തി",
    severity: "തീവ്രത",
    symptoms: "ലക്ഷണങ്ങൾ",
    treatment: "ശുപാർശ ചെയ്ത ചികിത്സ",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const rainfallData = [
  { day: "Mon", mm: 2 }, { day: "Tue", mm: 8 }, { day: "Wed", mm: 45 },
  { day: "Thu", mm: 60 }, { day: "Fri", mm: 30 }, { day: "Sat", mm: 5 },
  { day: "Sun", mm: 1 },
];

const marketPrices = [
  { crop: "🌾 Rice", price: "₹2,100/q", change: +3.2, trend: "up" },
  { crop: "🌽 Maize", price: "₹1,850/q", change: -1.5, trend: "down" },
  { crop: "🌿 Wheat", price: "₹2,350/q", change: +0.8, trend: "up" },
  { crop: "🌱 Cotton", price: "₹6,200/q", change: -2.1, trend: "down" },
  { crop: "🪴 Jute", price: "₹3,400/q", change: +5.0, trend: "up" },
];

const CROP_EMOJI: Record<string, string> = {
  Rice: "🌾", Wheat: "🌿", Maize: "🌽", Cotton: "🌱", Jute: "🪴",
};

function mockPredict(n: number, p: number, k: number, ph: number): string {
  if (ph < 6.5 && n > 70) return "Rice";
  if (p > 60 && ph > 6.0) return "Wheat";
  if (k > 55 && n > 65) return "Maize";
  if (p > 70 && n < 55) return "Cotton";
  return "Jute";
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GROQ DISEASE SCAN TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface DiseaseResult {
  disease_detected: boolean;
  disease_name: string;
  severity: "None" | "Low" | "Moderate" | "High" | "Critical";
  confidence_percent: number;
  symptoms: string[];
  treatment: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GROQ VISION API CALL
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithGroq(base64Image: string, mimeType: string): Promise<DiseaseResult> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;

  const prompt = `You are an expert plant pathologist. Analyze this plant image and respond ONLY with a valid JSON object — no markdown, no extra text.

JSON schema:
{
  "disease_detected": boolean,
  "disease_name": "string (specific disease name, or 'None' if healthy)",
  "severity": "None" | "Low" | "Moderate" | "High" | "Critical",
  "confidence_percent": number (0-100),
  "symptoms": ["array", "of", "observed", "symptoms"],
  "treatment": "string — specific actionable treatment recommendation"
}

Rules:
- If healthy: disease_detected=false, disease_name="None", severity="None"
- Be specific: identify real plant diseases (e.g. 'Early Blight', 'Powdery Mildew', 'Bacterial Leaf Blight')
- Symptoms: list exactly what you see in the image
- Treatment: include fungicide/pesticide names and application methods where applicable`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices[0]?.message?.content ?? "";

  // Strip any markdown code fences if present
  const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as DiseaseResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. HELPER — convert File to base64
// ─────────────────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:image/jpeg;base64,<data>"
      const [header, base64] = result.split(",");
      const mimeType = header.replace("data:", "").replace(";base64", "");
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SEVERITY BADGE STYLE
// ─────────────────────────────────────────────────────────────────────────────
function severityStyle(s: string) {
  const map: Record<string, string> = {
    None: "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
    Low: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40",
    Moderate: "bg-orange-900/40 text-orange-400 border-orange-700/40",
    High: "bg-red-900/40 text-red-400 border-red-700/40",
    Critical: "bg-red-950/60 text-red-300 border-red-600/50",
  };
  return map[s] ?? "bg-slate-800 text-slate-400 border-slate-600";
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check existing Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsAuthed(true);
        setUserEmail(data.session.user.email ?? null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = () => setIsAuthed(true);
  const handleLogout = async () => {
    await supabase.auth.signOut().catch(() => { });
    setIsAuthed(false);
    setUserEmail(null);
  };

  // Show login page if not authenticated
  if (!isAuthed) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return <Dashboard userEmail={userEmail} onLogout={handleLogout} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ userEmail, onLogout }: { userEmail: string | null; onLogout: () => void }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => translations[lang][key] ?? key;

  const [weather] = useState({ temp: 31, humidity: 72, wind: 18 });

  // Disease Scanner
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DiseaseResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasGroqKey = !!(import.meta.env.VITE_GROQ_API_KEY as string);

  // Crop recommendation
  const [form, setForm] = useState({ nitrogen: "", phosphorus: "", potassium: "", ph: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ crop: string; confidence: number; isFallback: boolean } | null>(null);
  const [historyLog, setHistoryLog] = useState<{ location: string; crop: string; time: string }[]>([]);

  // ── Disease scanner handlers ──────────────────────────────────────────────
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) startScan(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startScan(file);
  };

  const startScan = async (file: File) => {
    setScanResult(null);
    setScanError(null);
    setScanPreview(URL.createObjectURL(file));
    setScanning(true);

    if (!hasGroqKey) {
      setScanning(false);
      setScanError(t("scanNoKey"));
      return;
    }

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const result = await analyzeWithGroq(base64, mimeType);
      setScanResult(result);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setScanning(false);
    }
  };

  // ── Crop recommendation handler ─────────────────────────────────────────
  const handlePredict = async () => {
    const { nitrogen, phosphorus, potassium, ph, location } = form;
    if (!nitrogen || !phosphorus || !potassium || !ph || !location) return;
    setLoading(true);
    setResult(null);

    const payload = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      ph: parseFloat(ph),
      location,
    };

    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResult({ crop: data.predicted_crop, confidence: Math.round(data.confidence * 100), isFallback: false });
      addToHistory(location, data.predicted_crop);
      await savePredictionHistory(location, data.predicted_crop);
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
      const crop = mockPredict(payload.nitrogen, payload.phosphorus, payload.potassium, payload.ph);
      setResult({ crop, confidence: Math.floor(Math.random() * 15 + 75), isFallback: true });
      addToHistory(location, crop);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (location: string, crop: string) => {
    setHistoryLog((prev) => [{ location, crop, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 9. RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 text-white font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/70 border-b border-green-800/40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/60">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent leading-tight">
              {t("appName")}
            </h1>
            <p className="text-xs text-slate-400 leading-none">{t("tagline")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Language toggles */}
          <Globe className="w-4 h-4 text-green-400" />
          {(["en", "ta", "ml"] as Lang[]).map((l) => (
            <button key={l} id={`lang-${l}`} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${lang === l ? "bg-green-500 text-white shadow-md" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}>
              {l === "en" ? "English" : l === "ta" ? "தமிழ்" : "മലയാളം"}
            </button>
          ))}

          {/* User + logout */}
          {userEmail && (
            <span className="hidden sm:block text-xs text-slate-500 ml-2">{userEmail}</span>
          )}
          <button id="btn-logout" onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs font-medium transition-all border border-slate-700/50 hover:border-red-700/50">
            <LogOut className="w-3.5 h-3.5" />
            {t("logout")}
          </button>
        </div>
      </header>

      {/* ALERT BANNER */}
      <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 backdrop-blur-sm px-6 py-2.5 flex items-center gap-3 text-sm text-white border-b border-amber-500/30">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <span className="font-semibold mr-2">{t("alertTitle")}:</span>
        <span className="text-amber-100">{t("alertMsg")}</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ROW 1: Weather + Rainfall */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weather */}
          <div className="bg-gradient-to-br from-blue-900/60 to-slate-800/60 border border-blue-700/30 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-yellow-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t("weatherWidget")}</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: t("temp"), value: `${weather.temp}°C`, icon: <Thermometer className="w-4 h-4 text-red-400" /> },
                { label: t("humidity"), value: `${weather.humidity}%`, icon: <Droplets className="w-4 h-4 text-blue-400" /> },
                { label: t("wind"), value: `${weather.wind} km/h`, icon: <Wind className="w-4 h-4 text-teal-400" /> },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-slate-300">{row.icon}{row.label}</div>
                  <span className="text-xl font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Chart */}
          <div className="md:col-span-2 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <CloudRain className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t("rainfallChart")}</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rainfallData}>
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="mm" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#60a5fa" }} />
                <Area type="monotone" dataKey="mm" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#rainGrad)" dot={{ fill: "#3b82f6", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2: Disease Scanner + Market Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── AI Disease Scanner ── */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-400" />
                <h2 className="text-sm font-semibold text-slate-300">{t("diseaseScanner")}</h2>
              </div>
              {hasGroqKey
                ? <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full flex items-center gap-1"><Zap className="w-3 h-3" />Groq AI</span>
                : <span className="text-xs bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full">No API Key</span>
              }
            </div>

            {/* Drop zone */}
            <div
              id="disease-drop-zone"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-green-700/50 rounded-xl p-5 text-center cursor-pointer hover:border-green-500/80 hover:bg-green-900/10 transition-all duration-200"
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              {scanPreview
                ? <img src={scanPreview} alt="crop" className="h-32 w-auto rounded-lg object-cover shadow-md mx-auto mb-3" />
                : <Upload className="w-10 h-10 text-green-600 mx-auto mb-2" />
              }
              {scanning
                ? <div className="flex items-center justify-center gap-2 text-blue-400 text-sm animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("scanning")}
                </div>
                : <p className="text-slate-400 text-sm">{scanPreview ? "Click to upload a different image" : t("dropHint")}</p>
              }
              {!scanPreview && <p className="text-xs text-slate-600 mt-1">{t("scanHint")}</p>}
            </div>

            {/* Error */}
            {scanError && (
              <div className="mt-3 p-3 rounded-xl bg-red-900/30 border border-red-700/40 flex items-start gap-2 text-sm text-red-300">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {scanError}
              </div>
            )}

            {/* ── Disease Result Card ── */}
            {scanResult && !scanning && (
              <div className={`mt-4 rounded-xl border p-4 animate-fade-in ${scanResult.disease_detected
                  ? "bg-red-950/40 border-red-700/40"
                  : "bg-emerald-950/40 border-emerald-700/40"
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {scanResult.disease_detected
                      ? <ShieldAlert className="w-5 h-5 text-red-400" />
                      : <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    }
                    <span className={`font-bold text-base ${scanResult.disease_detected ? "text-red-300" : "text-emerald-300"}`}>
                      {scanResult.disease_detected ? t("diseased") : t("healthy")}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${severityStyle(scanResult.severity)}`}>
                    {t("severity")}: {scanResult.severity}
                  </span>
                </div>

                {scanResult.disease_detected && (
                  <p className="text-white font-semibold text-lg mb-3">{scanResult.disease_name}</p>
                )}

                {/* Confidence bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${scanResult.confidence_percent}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{scanResult.confidence_percent}%</span>
                </div>

                {/* Symptoms */}
                {scanResult.symptoms.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3" />{t("symptoms")}
                    </p>
                    <ul className="space-y-1">
                      {scanResult.symptoms.map((s, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment */}
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{t("treatment")}</p>
                  <p className="text-sm text-slate-200">{scanResult.treatment}</p>
                </div>
              </div>
            )}
          </div>

          {/* Market Prices */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t("marketPrices")}</h2>
            </div>
            <div className="space-y-2">
              {marketPrices.map((item) => (
                <div key={item.crop}
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors">
                  <span className="text-sm font-medium text-slate-200">{item.crop}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{item.price}</span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${item.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                      {item.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {item.change > 0 ? "+" : ""}{item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CROP RECOMMENDATION ENGINE */}
        <div className="bg-gradient-to-br from-green-950/80 to-slate-900/80 border border-green-700/30 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-base font-bold text-green-300">{t("cropEngine")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {[
              { id: "input-nitrogen", label: t("nitrogen"), key: "nitrogen", placeholder: "e.g. 90", step: "1" },
              { id: "input-phosphorus", label: t("phosphorus"), key: "phosphorus", placeholder: "e.g. 45", step: "1" },
              { id: "input-potassium", label: t("potassium"), key: "potassium", placeholder: "e.g. 40", step: "1" },
              { id: "input-ph", label: t("ph"), key: "ph", placeholder: "e.g. 6.5", step: "0.1" },
            ].map(({ id, label, key, placeholder, step }) => (
              <div key={id}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input id={id} type="number" step={step} min={0} placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{t("location")}</label>
              <input id="input-location" type="text" placeholder="e.g. Madurai, Tamil Nadu"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all" />
            </div>
          </div>

          <button id="btn-predict" onClick={handlePredict} disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-green-900/40 hover:from-green-400 hover:to-emerald-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t("predicting")}</>
              : <><Leaf className="w-4 h-4" />{t("predict")}</>
            }
          </button>

          {result && (
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-green-900/40 border border-emerald-600/40 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-7xl drop-shadow-lg">{CROP_EMOJI[result.crop] ?? "🌱"}</div>
                <div className="text-center sm:text-left">
                  <p className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-1">{t("result")}</p>
                  <p className="text-3xl font-black text-white leading-none mb-2">{result.crop}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${result.confidence}%` }} />
                    </div>
                    <span className="text-sm text-emerald-300 font-bold">{result.confidence}% {t("confidence")}</span>
                  </div>
                  {result.isFallback && <p className="text-xs text-amber-400 mt-2">{t("fallbackNote")}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HISTORY */}
        {historyLog.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t("history")}</h2>
            </div>
            <div className="space-y-2">
              {historyLog.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 bg-slate-900/50 rounded-lg text-sm">
                  <span className="text-slate-400">{item.time}</span>
                  <span className="text-slate-300">{item.location}</span>
                  <span className="font-semibold text-emerald-400">{CROP_EMOJI[item.crop]} {item.crop}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-800/60 mt-8">
        AgroSense Dashboard  {new Date().getFullYear()}
      </footer>
    </div>
  );
}
