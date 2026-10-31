-- ==========================================
-- JOB TRACKER - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Run this in your Supabase project's SQL Editor.

-- 1. Create enum for job statuses (optional or use text with check)
CREATE TYPE job_status AS ENUM (
  'Saved',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted'
);

CREATE TYPE workplace_type AS ENUM (
  'Remote',
  'Hybrid',
  'On-site'
);

-- 2. Create the jobs table
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

-- 3. Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_followup ON public.jobs(followup_date);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 5. Open policy for individual / demo use (or tighten with auth.uid() when user logins are enabled)
CREATE POLICY "Allow public read and write for jobs"
  ON public.jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON public.jobs;
CREATE TRIGGER trigger_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
