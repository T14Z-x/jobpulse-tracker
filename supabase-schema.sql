-- Run this in your Supabase Dashboard -> SQL Editor -> New Query:
-- Supports BOTH Multi-User Accounts (Supabase Auth) AND Personal Cloud Mode!

-- 1. Jobs Pipeline Table
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

-- Ensure user_id column exists if upgrading from an older table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs (user_id);

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

-- Unauthenticated (personal mode) can access rows with user_id IS NULL
CREATE POLICY "Anon manage public jobs"
  ON public.jobs
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);


-- 2. Candidate Profiles Table (Quick-Copy Snippets & Cover Note Template)
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


-- 3. Cloud CV Vault Table
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

CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON public.resumes (user_id);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.resumes TO authenticated;

DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
CREATE POLICY "Users manage own resumes"
  ON public.resumes
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
