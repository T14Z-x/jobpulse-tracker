'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Copy, Check, RefreshCw, ArrowUpRight } from 'lucide-react';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, testSupabaseConnection } from '@/lib/supabase';
import { syncLocalToSupabase } from '@/lib/storage';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const SUPABASE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor:
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
  WITH CHECK (true);`;

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onNotify,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);

    saveStoredSupabaseConfig(url, anonKey);

    if (!url.trim() || !anonKey.trim()) {
      setTesting(false);
      setTestResult({
        success: false,
        message: 'Running in local storage mode. Enter credentials to connect Supabase.',
      });
      onNotify('info', 'Switched to local storage');
      onRefreshData();
      return;
    }

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      onNotify('success', 'Supabase credentials verified');
      onRefreshData();
    } else {
      onNotify('error', res.message);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    onNotify('success', 'SQL schema copied');
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    const res = await syncLocalToSupabase();
    setSyncing(false);

    if (res.error) {
      onNotify('error', `Sync failed: ${res.error}`);
    } else {
      onNotify('success', `Synced ${res.syncedCount} application(s) to Supabase`);
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] rounded-2xl shadow-xl border border-[var(--line)] p-5 my-8">
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Supabase Database</h2>
              <p className="text-xs text-[var(--muted)]">Sync applications across devices or host on Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
              Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
              Anon public API key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1Ni..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                testResult.success
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20'
                  : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="p-3.5 bg-[var(--surface-subtle)] rounded-xl border border-[var(--line)] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--ink)]">Setup Instructions</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
              >
                Supabase Dashboard <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Create a free Supabase project, run the SQL schema in the SQL Editor, and paste your API keys above.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied to clipboard' : 'Copy SQL schema'}
              </button>
              {url && anonKey && (
                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-ink)] text-xs font-medium rounded-lg transition-opacity cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync local to Supabase'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveAndTest}
            disabled={testing}
            className="px-4 py-1.5 text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-ink)] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Save & test connection
          </button>
        </div>
      </div>
    </div>
  );
};
