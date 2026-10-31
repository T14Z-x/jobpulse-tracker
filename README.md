# JobTracker.pro 📋🚀

A modern, production-grade Job Application & Pipeline Tracker built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed for seamless hosting on **Vercel** with full **Supabase Cloud Database** sync and offline-first LocalStorage/IndexedDB fallback.

---

## ✨ Features

- **📊 Pipeline Analytics**: Real-time counters for Total Applications, Active Pipelines, Offers, Overdue/Due Follow-ups, and Interview Conversion Rates.
- **📌 Dual Views**:
  - **Interactive Kanban Board**: Visual columns (*Saved, Applied, Interview, Offer, Rejected, Ghosted*) with drag-and-drop cards and 1-click stage transitions.
  - **Card Grid View**: Responsive multi-column layout with quick status selectors, tech tags, notes preview, and direct links.
- **🎉 Celebratory Confetti**: Instant micro-interaction celebration whenever an application moves to the **Offer** stage!
- **📸 Screenshot Capture**: Attach posting screenshots via drag-and-drop, file picker, or `Ctrl+V` clipboard paste. Images are client-compressed via HTML `<canvas>` and stored safely.
- **⏰ Follow-up Alerts**: Visual urgency badges for applications where follow-up is due today or overdue, with 1-click scheduling presets (+3 days, +1 week, +2 weeks).
- **☁️ Supabase Cloud Sync**:
  - Direct connection to Supabase PostgreSQL table with automatic schema updater and RLS policies.
  - In-app connection tester and 1-click local-to-cloud data migration.
- **💾 Offline-First & Portability**:
  - Seamlessly functions without internet connection via LocalStorage & IndexedDB.
  - **Export JSON Backup** (preserves job data + all screenshot images).
  - **Import JSON Backup** for effortless device migration.
  - **Export CSV** for spreadsheets (Excel / Google Sheets / Notion).
- **🌓 Dark & Light Modes**: Polished, tailored color scheme with automatic system preference detection.
- **⌨️ Keyboard Shortcuts**: `Cmd+K` / `Ctrl+K` for global search, `N` for new application.

---

## 🚀 Quick Start (Local Development)

1. Clone or navigate to the project directory:
   ```bash
   cd "/Users/t14z-x/Job Tracker"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Connecting Supabase Cloud Database

You can connect Supabase in either of two ways:

### Option A: Using the In-App Modal (Zero-code)
1. In the app, click the **Database** button in the top navbar.
2. Click **Copy SQL Schema** and run it in your [Supabase SQL Editor](https://supabase.com/dashboard).
3. Paste your **Project URL** and **Anon Key** from *Project Settings → API*.
4. Click **Save & Test Connection**, then click **Upload Local Data to Supabase**!

### Option B: Using Environment Variables (`.env.local`)
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### SQL Schema (`supabase/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Saved',
  workplace TEXT,
  type TEXT,
  applied_date DATE,
  followup_date DATE,
  contact_name TEXT,
  contact_email TEXT,
  salary TEXT,
  resume_version TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  screenshots TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write for jobs"
  ON public.jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 🌐 Deploying to Vercel

### Method 1: Vercel Dashboard (Recommended)
1. Push this project to GitHub / GitLab / Bitbucket:
   ```bash
   git add .
   git commit -m "feat: complete JobTracker with Next.js and Supabase"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Select your repository.
4. (Optional) Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically detect Next.js and deploy your app in under a minute!

### Method 2: Vercel CLI
```bash
npx vercel
```
Follow the interactive prompts to deploy directly from your terminal.
