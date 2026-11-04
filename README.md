# Pipeline — Job Application Tracker & Live Discovery Hub

A minimalist, craft-grade Job Application Tracker & Live Job Discovery Platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS 4**, and **Supabase**.

---

## Key Features

- **Live Job Discovery Feed (`Discover Jobs` Tab)**:
  - **Bangladesh Market (`LinkedIn BD` + `BDJobs`)**: Real-time server-side aggregation from LinkedIn's Bangladesh guest search and BDJobs listings.
  - **International Remote (`Remotive` + `Arbeitnow`)**: Zero-key public API aggregation for worldwide remote tech, product, design, and marketing openings.
  - **1-Click Save & Apply**: Bookmark any discovered job to `Saved`, or click **Apply & Track** to launch the posting and automatically log it into your `Applied` pipeline with a 7-day follow-up reminder.
- **Zero-Friction Application Logging**:
  - **Inline 2-Field Quick Bar**: Type `Company` + `Role` (and optional URL) directly on the dashboard and press `Enter`.
  - **Progressive Disclosure Modal**: Streamlined form with 1-click stage pills, smart company name inference from Greenhouse/Lever/Ashby links, `⌘V` screenshot pasting, and an expandable drawer for compensation, dates, location, and recruiter contact.
- **Dual Pipeline Views**:
  - **Grid View** and **Drag-and-Drop Kanban Board** (`Saved`, `Applied`, `Interview`, `Offer`, `Rejected`, `Ghosted`).
- **Local-First + Optional Supabase Cloud Sync**:
  - Works out-of-the-box in the browser (`localStorage` + `IndexedDB` for compressed posting screenshots) and syncs with **Supabase Postgres** across devices.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Database Setup (Optional Cloud Sync)

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** → **New Query**, paste the contents of [`supabase-schema.sql`](./supabase-schema.sql), and click **Run**.
3. Copy your **Project URL** and **Anon Public Key** from **Project Settings → API**.
4. Either paste them in the in-app **Local / Cloud** modal, or set them in `.env.local` (see [`.env.example`](./.env.example)):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Environment Variables** (optional if using in-app setup or local mode).
4. Click **Deploy**.
