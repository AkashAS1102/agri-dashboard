// src/LoginPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Beautiful Login / Sign-up page backed by Supabase Auth.
// Uses email + password. Toggling between Login and Register modes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { supabase } from "./supabase";
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sprout } from "lucide-react";

type Mode = "login" | "register";

interface Props {
  onAuth: () => void; // called on successful login/register
}

export default function LoginPage({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const noSupabase =
    !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL === "https://placeholder.supabase.co";

  // ── Guest bypass (no Supabase configured) ────────────────────────────────
  const handleGuest = () => onAuth();

  // ── Auth handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (noSupabase) {
      // Graceful bypass — no Supabase keys configured
      onAuth();
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex items-center justify-center p-4">

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl shadow-green-900/50 mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
            AgroSense
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Predictive Agriculture Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">

          {/* Mode toggle */}
          <div className="flex bg-slate-800/60 rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                id={`tab-${m}`}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m
                    ? "bg-green-500 text-white shadow-md shadow-green-900/50"
                    : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Supabase warning */}
          {noSupabase && (
            <div className="mb-4 p-3 rounded-xl bg-amber-900/30 border border-amber-700/40 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                Supabase not configured. Add <code className="bg-slate-800 px-1 rounded">VITE_SUPABASE_URL</code> &amp;{" "}
                <code className="bg-slate-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your{" "}
                <code className="bg-slate-800 px-1 rounded">.env</code> file, or use Guest mode below.
              </p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/40 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/40 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="input-password"
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-green-900/40 hover:from-green-400 hover:to-emerald-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                : mode === "login" ? "Sign In to Dashboard" : "Create My Account"
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          {/* Guest access */}
          <button
            id="btn-guest"
            onClick={handleGuest}
            className="w-full py-2.5 rounded-xl border border-slate-600/50 text-slate-300 text-sm font-medium hover:bg-slate-800/60 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sprout className="w-4 h-4 text-green-500" />
            Continue as Guest
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          AgroSense · By AS
        </p>
      </div>
    </div>
  );
}
