# JobPulse — Live Job Discovery & Application Pipeline Tracker

**JobPulse** is an all-in-one job application tracker, PDF CV vault, smart URL clipper, and real-time job discovery platform for **Bangladesh (`LinkedIn BD` & `BDJobs`)** and **International Remote (`Remotive` & `Arbeitnow`)** roles.

Created by **[Gazi Asif Imtiaz](https://t14z.vercel.app)**.

---

## Key Features

- **🌍 Live Job Discovery Feed (`Discover Jobs` Tab)**:
  - **Bangladesh Market (`LinkedIn BD` + `BDJobs`)**: Real-time server-side aggregation from LinkedIn's Bangladesh job search and BDJobs listings across all industries (*Marketing, Finance & Banking, Sales, HR, Customer Support, Operations, MTO, NGO, Design, Software*).
  - **International Remote (`Remotive` + `Arbeitnow`)**: Zero-key public API aggregation for worldwide remote openings with salary ranges and company logos.
  - **1-Click Apply & Track**: Launches the job posting, **copies a tailored cover note** (`Dear Hiring Team at {company}...`) to your clipboard, links your **Default CV**, and automatically logs the job into your `Applied` pipeline with a 7-day follow-up reminder.
- **📄 CV Vault & Quick-Copy Candidate Profile**:
  - Store multiple PDF CVs locally in `IndexedDB` with instant in-browser PDF preview, 1-click download, and Default CV selection.
  - Save your reusable candidate profile (Name, Email, Phone, LinkedIn, Portfolio `https://t14z.vercel.app`, Expected Salary, and Cover Note template) with 1-click copy buttons.
- **✨ Smart URL Clipper (`Auto-fill`)**:
  - Paste any LinkedIn, BDJobs, Greenhouse, Lever, or career link into the modal and click **Auto-fill** to scrape the Company, Role, Location, Workplace, Salary, and Description via `JobPosting` JSON-LD schema and Jina Reader (`r.jina.ai`).
- **📋 Zero-Friction Pipeline Management**:
  - **2-Second Inline Quick Log Bar** on the main dashboard.
  - **Grid View** & **Drag-and-Drop Kanban Board** (*Saved → Applied → Interview → Offer → Rejected → Ghosted*).
  - **Posting Screenshot Vault**: Drag-and-drop or press `⌘V` / `Ctrl+V` to attach compressed posting screenshots.
  - **Local-First + Supabase Cloud Sync**: Works offline immediately and syncs across devices with **Supabase Postgres**, plus 1-click **JSON Backup** and **CSV Export**.

---

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Database Setup (Optional Cloud Sync)

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** → **New Query**, paste the contents of [`supabase-schema.sql`](./supabase-schema.sql), and click **Run**.
3. Copy your **Project URL** and **Anon Public Key** from **Project Settings → API** and paste them in the in-app **Cloud / Local** modal or in `.env.local` (see [`.env.example`](./.env.example)).

---

## Author

**Gazi Asif Imtiaz**  
Portfolio: [https://t14z.vercel.app](https://t14z.vercel.app)  
GitHub: [@T14Z-x](https://github.com/T14Z-x)
