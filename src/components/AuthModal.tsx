'use client';

import React, { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { syncLocalToSupabase } from '@/lib/storage';
import { syncVaultFromCloud } from '@/lib/cv-storage';
import { X, UserCheck, LogOut, RefreshCw, Database, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  userEmail: string | null;
  onClose: () => void;
  onAuthChange: () => void;
  onOpenDatabaseSetup: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  userEmail,
  onClose,
  onAuthChange,
  onOpenDatabaseSetup,
  onNotify,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      onNotify('error', 'Connect your Supabase database first');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          await syncLocalToSupabase();
          await syncVaultFromCloud();
          onNotify('success', 'Account created & local pipeline synced!');
          onAuthChange();
          onClose();
        } else {
          onNotify('info', 'Check your email to confirm your account, or sign in if confirmation is disabled in Supabase.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await syncVaultFromCloud();
        onNotify('success', 'Signed in to your cloud workspace');
        onAuthChange();
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      onNotify('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToAccount = async () => {
    setSyncing(true);
    const res = await syncLocalToSupabase();
    await syncVaultFromCloud();
    setSyncing(false);

    if (res.error) {
      onNotify('error', res.error);
    } else {
      onNotify('success', `Synced ${res.syncedCount} job(s) & CV Vault to your account`);
      onAuthChange();
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    onNotify('info', 'Signed out');
    onAuthChange();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[var(--surface)] text-[var(--ink)] rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line-subtle)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[13px] font-semibold tracking-tight">
              {userEmail ? 'Cloud Account' : mode === 'signin' ? 'Sign in to JobPulse' : 'Create a JobPulse Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!supabase ? (
          <div className="p-5 space-y-3 text-center">
            <Database className="w-7 h-7 text-[var(--muted)] mx-auto" />
            <h3 className="text-[13px] font-semibold">Supabase Cloud Not Connected</h3>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed">
              To enable multi-user accounts and cross-device cloud sync, connect your Supabase project URL and Anon Key first.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDatabaseSetup();
              }}
              className="w-full py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] text-[12px] font-semibold cursor-pointer"
            >
              Configure Supabase Connection
            </button>
          </div>
        ) : userEmail ? (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-[var(--muted)]">Signed in as</p>
                <p className="text-[13px] font-semibold text-[var(--ink)] truncate">{userEmail}</p>
              </div>
            </div>

            <p className="text-[12px] text-[var(--muted)] leading-relaxed">
              Your job pipeline, PDF CV Vault, and candidate profile are privately isolated to your account via Supabase Row-Level Security.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncToAccount}
                className="w-full py-2 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync local jobs & CVs to cloud account'}</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 px-3 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] text-[var(--danger)] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-0.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line-subtle)]">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Create Account
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
              />
            </div>

            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              {mode === 'signup'
                ? 'Creating an account syncs your jobs, PDF CVs, and profile across your phone and laptop.'
                : 'Sign in to access your synced job pipeline and CV Vault from any device.'}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign in to workspace'
                : 'Create account & sync'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
