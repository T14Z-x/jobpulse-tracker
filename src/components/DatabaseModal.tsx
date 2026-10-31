'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Copy, Check, RefreshCw, ArrowUpRight, HelpCircle } from 'lucide-react';
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
        message: 'Running in Local Storage Mode (Offline/In-Browser). Enter URL and Key to connect Supabase.',
      });
      onNotify('info', 'Switched to Local Storage Mode');
      onRefreshData();
      return;
    }

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      onNotify('success', 'Supabase credentials saved and verified!');
      onRefreshData();
    } else {
      onNotify('error', res.message);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    onNotify('success', 'SQL Schema copied to clipboard!');
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    const res = await syncLocalToSupabase();
    setSyncing(false);

    if (res.error) {
      onNotify('error', `Sync failed: ${res.error}`);
    } else {
      onNotify('success', `Successfully synced ${res.syncedCount} application(s) to Supabase!`);
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Supabase Cloud Database</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync applications across all your devices or host on Vercel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJh..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                Quick 2-Minute Supabase Setup
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Open Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Create a free project at <b>supabase.com</b>.</li>
              <li>Go to <b>SQL Editor</b>, paste the schema below, and click <b>Run</b>.</li>
              <li>Go to <b>Project Settings → API</b> and copy your URL & Anon Key into the boxes above.</li>
            </ol>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
              </button>
              {url && anonKey && (
                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Upload Local Data to Supabase'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveAndTest}
            disabled={testing}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {testing && <RefreshCw className="w-4 h-4 animate-spin" />}
            Save & Test Connection
          </button>
        </div>
      </div>
    </div>
  );
};
