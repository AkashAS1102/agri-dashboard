// src/supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Supabase client initialization.
//
// Setup in Supabase dashboard:
//   1. Create a project at https://supabase.com
//   2. Create a table called `search_history` with columns:
//      id          uuid  primary key default uuid_generate_v4()
//      location    text
//      predicted_crop text
//      created_at  timestamptz default now()
//   3. Copy your Project URL and anon key into .env:
//      VITE_SUPABASE_URL=https://xxxx.supabase.co
//      VITE_SUPABASE_ANON_KEY=eyJhbGci...
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Guard: warn clearly in dev if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).\n" +
      "   History saving will be disabled. Add them to a .env file to enable."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// ── Helper: save a prediction to `search_history` ─────────────────────────────
export async function savePredictionHistory(
  location: string,
  predicted_crop: string
): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) return; // silently skip if not configured

  const { error } = await supabase
    .from("search_history")
    .insert([{ location, predicted_crop }]);

  if (error) {
    console.error("Supabase insert error:", error.message);
  } else {
    console.log(`✅ History saved: ${predicted_crop} @ ${location}`);
  }
}
