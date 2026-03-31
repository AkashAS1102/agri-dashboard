# AgroSense — Deployment Guide

Complete instructions for deploying the **frontend to Vercel** and the **Python backend to Render** (both free tiers).

---

## Part 1 — Push to GitHub

### 1.1 Create a `.gitignore`

Make sure these are ignored before committing:

```
node_modules/
dist/
.env
backend/venv/
backend/model.pkl
backend/__pycache__/
*.pyc
```

### 1.2 Initialize and push

```bash
cd agri-dashboard

git init
git add .
git commit -m "feat: initial AgroSense dashboard"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/agri-dashboard.git
git branch -M main
git push -u origin main
```

---

## Part 2 — Deploy Frontend to Vercel (Free)

### 2.1 Sign up / log in
Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.

### 2.2 Import project
1. Click **"Add New Project"**
2. Select your `agri-dashboard` GitHub repository
3. Vercel will auto-detect it as a **Vite** project

### 2.3 Configure build settings
Vercel's defaults work. Confirm these are set:

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 2.4 Set Environment Variables

In Vercel dashboard → Project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `VITE_GROQ_API_KEY` | `gsk_...` |
| `VITE_API_URL` | `https://your-app.onrender.com` (add after backend deploy) |

### 2.5 Deploy
Click **"Deploy"**. Vercel will build and give you a URL like `https://agri-dashboard.vercel.app`.

> Every `git push` to `main` will trigger an automatic re-deploy.

### 2.6 SPA Routing
The `vercel.json` file in the root already handles SPA routing — no extra steps needed.

---

## Part 3 — Deploy FastAPI Backend to Render (Free)

### 3.1 Sign up
Go to [render.com](https://render.com) and sign in with GitHub.

### 3.2 Create a Web Service
1. Click **"New → Web Service"**
2. Connect your `agri-dashboard` GitHub repo
3. Set the **Root Directory** to: `backend`

### 3.3 Configure the service

| Setting | Value |
|---|---|
| Name | `agrosense-api` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt && python train_model.py` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

### 3.4 Deploy
Click **"Create Web Service"**. After ~3 minutes you'll get a URL like:
`https://agrosense-api.onrender.com`

### 3.5 Update Vercel env var
Go back to Vercel → Environment Variables → update `VITE_API_URL`:
```
VITE_API_URL = https://agrosense-api.onrender.com
```
Then trigger a re-deploy in Vercel.

### 3.6 Test the API
Open `https://agrosense-api.onrender.com/docs` — you'll see the interactive Swagger UI.

---

## Part 4 — Supabase Setup (for Auth + History)

### 4.1 Create project
Go to [supabase.com](https://supabase.com) → New Project.

### 4.2 Create the history table
In **SQL Editor**, run:

```sql
create table if not exists search_history (
  id             uuid primary key default uuid_generate_v4(),
  location       text,
  predicted_crop text,
  created_at     timestamptz default now()
);

-- Allow anonymous inserts (adjust based on your RLS policy)
alter table search_history enable row level security;
create policy "Allow inserts" on search_history for insert with check (true);
create policy "Allow selects" on search_history for select using (true);
```

### 4.3 Enable Email Auth
Go to **Authentication → Providers → Email** and make sure it is enabled.

### 4.4 Get your keys
Go to **Settings → API**:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

## Part 5 — Groq API Key (for Disease Scanner)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card needed)
3. Navigate to **API Keys → Create API Key**
4. Copy the key starting with `gsk_...`
5. Add as `VITE_GROQ_API_KEY` in Vercel + your local `.env`

> **Free Tier Limits:** ~30 requests/minute, 14,400 tokens/minute — plenty for an MVP.
> Model used: `meta-llama/llama-4-scout-17b-16e-instruct` (vision-capable, free)

---

## Summary Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked to GitHub
- [ ] Vercel env vars set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GROQ_API_KEY`, `VITE_API_URL`)
- [ ] Backend deployed to Render
- [ ] `VITE_API_URL` in Vercel updated to Render URL
- [ ] Supabase table `search_history` created
- [ ] Supabase Auth (Email) enabled
- [ ] Groq API key obtained and added

---

## Architecture Overview

```
Browser (Vercel)
  │
  ├─→ Supabase Auth        (login / register / session)
  ├─→ Groq Vision API      (disease scanner — direct from browser)
  ├─→ Supabase DB          (save search_history)
  └─→ FastAPI (Render)     (crop recommendation — Random Forest)
         └─→ model.pkl     (trained Scikit-Learn model)
```
