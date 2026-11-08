-- =====================================================================
-- JOBPULSE - COMPLETE CLOUD & MULTI-USER SUPABASE SCHEMA
-- Run this entire script in your Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. JOBS PIPELINE TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Safe migration if upgrading an existing jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_followup ON public.jobs(followup_date);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.jobs TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public read and write for jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users manage own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anon manage public jobs" ON public.jobs;

-- Authenticated users strictly access only their own rows
CREATE POLICY "Users manage own jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Unauthenticated (personal single-user mode) can access rows where user_id IS NULL
CREATE POLICY "Anon manage public jobs"
  ON public.jobs
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);


-- 2. CANDIDATE PROFILES TABLE (Quick-Copy Snippets & Cover Note Template)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  expected_salary TEXT,
  notice_period TEXT,
  cover_note_template TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- 3. CLOUD CV VAULT TABLE (PDF Resumes)
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_data TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.resumes TO authenticated;

DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
CREATE POLICY "Users manage own resumes"
  ON public.resumes
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- 4. CLOUD SCREENSHOTS TABLE (Cross-Device Posting Screenshots)
CREATE TABLE IF NOT EXISTS public.screenshots (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON public.screenshots(user_id);
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.screenshots TO anon, authenticated;

DROP POLICY IF EXISTS "Users manage own screenshots" ON public.screenshots;
DROP POLICY IF EXISTS "Anon manage public screenshots" ON public.screenshots;

CREATE POLICY "Users manage own screenshots"
  ON public.screenshots
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Anon manage public screenshots"
  ON public.screenshots
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);


-- 5. AUTO-UPDATE updated_at TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON public.jobs;
CREATE TRIGGER trigger_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
