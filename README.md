# JobPulse — Live Job Discovery & Application Pipeline Tracker

[![JobPulse CI](https://github.com/T14Z-x/jobpulse-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/T14Z-x/jobpulse-tracker/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase Cloud](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Creator: Gazi Asif Imtiaz](https://img.shields.io/badge/Creator-Gazi%20Asif%20Imtiaz-18181b?url=https://t14z.vercel.app)](https://t14z.vercel.app)

**JobPulse** is an all-in-one job application tracker, PDF CV vault, smart URL clipper, and real-time job discovery platform for **Bangladesh (`LinkedIn BD` & `BDJobs`)** and **International Remote (`Remotive` & `Arbeitnow`)** roles.

Created by **[Gazi Asif Imtiaz](https://t14z.vercel.app)**.

---

## Key Features

- **🌍 Live Job Discovery Feed (`Discover Jobs` Tab)**:
  - **Bangladesh Market (`LinkedIn BD` + `BDJobs`)**: Real-time server-side aggregation from LinkedIn's Bangladesh job search and BDJobs listings across all industries (*Marketing, Finance & Banking, Sales, HR, Customer Support, Operations, MTO, NGO, Design, Software*).
  - **International Remote (`Remotive` + `Arbeitnow`)**: Zero-key public API aggregation for worldwide remote openings with salary ranges and company logos.
  - **2-Step Apply & Track Confirmation**: Launches the job posting, **copies a tailored cover note** (`Dear Hiring Team at {company}...`) to your clipboard, and prompts **"Did you apply?"** (*Yes, Applied* | *Save for later* | *No*) with 1-click **Undo**.
- **📄 CV Vault & Quick-Copy Candidate Profile**:
  - Store multiple PDF CVs locally in `IndexedDB` and sync across devices via Supabase `resumes` with instant in-browser PDF preview, 1-click download, and Default CV selection.
  - Save your reusable candidate profile (Name, Email, Phone, LinkedIn, Portfolio `https://t14z.vercel.app`, Expected Salary, and Cover Note template) with 1-click copy buttons.
- **✨ Smart URL Clipper (`Auto-fill`)**:
  - Paste any LinkedIn, BDJobs, Greenhouse, Lever, or career link into the modal and click **Auto-fill** to scrape the Company, Role, Location, Workplace, Salary, and Description via `JobPosting` JSON-LD schema and Jina Reader (`r.jina.ai`).
- **📋 Zero-Friction Pipeline Management**:
  - **2-Second Inline Quick Log Bar** on the main dashboard.
  - **Responsive Mobile & Desktop Workspace**: Dedicated 2-row mobile header, bottom-sheet modals, and 5-column full-width desktop grid + drag-and-drop **Kanban Board** (*Saved → Applied → Interview → Offer → Rejected → Ghosted*).
  - **Cross-Device Screenshot Vault**: Drag-and-drop or press `⌘V` / `Ctrl+V` to attach compressed posting screenshots synced across devices.
  - **Multi-User Cloud Sync (Supabase Auth + RLS)**: Private per-user workspaces backed by Postgres Row-Level Security, plus 1-click **JSON Backup** and **CSV Export**.

---

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Database Setup (Cloud Sync & Multi-User Auth)

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** → **New Query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
3. Copy your **Project URL** and **Publishable / Anon Key** from **Project Settings → API** and add them to `.env.local` (or Vercel Environment Variables):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

---

## Author

**Gazi Asif Imtiaz**  
Portfolio: [https://t14z.vercel.app](https://t14z.vercel.app)  
GitHub: [@T14Z-x](https://github.com/T14Z-x)
