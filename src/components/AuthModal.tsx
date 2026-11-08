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
          onNotify(
            'info',
            'Check your email to confirm your account, or sign in if confirmation is disabled in Supabase.'
          );
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
    localStorage.removeItem('jobtracker_v2_jobs');
    localStorage.removeItem('pipeline.resumes.v1');
    localStorage.removeItem('pipeline.profile.v1');
    onNotify('info', 'Signed out & cleared session cache');
    onAuthChange();
    onClose();
  };

  const handleResetPassword = async () => {
    if (!supabase) return;
    if (!email.trim()) {
      onNotify('error', 'Enter your email address above first');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      onNotify('success', 'Password reset email sent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset email';
      onNotify('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[var(--surface)] text-[var(--ink)] rounded-t-2xl sm:rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line-subtle)]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-[15px] sm:text-[16px] font-semibold tracking-tight">
              {userEmail
                ? 'Cloud Account'
                : mode === 'signin'
                ? 'Sign in to JobPulse'
                : 'Create a JobPulse Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!supabase ? (
          <div className="p-5 space-y-3.5 text-center">
            <Database className="w-8 h-8 text-[var(--muted)] mx-auto" />
            <h3 className="text-[15px] font-semibold">Supabase Cloud Not Connected</h3>
            <p className="text-[13.5px] text-[var(--muted)] leading-relaxed">
              To enable multi-user accounts and cross-device cloud sync, connect your Supabase project URL and Anon Key first.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDatabaseSetup();
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-[14px] font-semibold cursor-pointer"
            >
              Configure Supabase Connection
            </button>
          </div>
        ) : userEmail ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-[var(--muted)]">Signed in as</p>
                <p className="text-[14.5px] font-semibold text-[var(--ink)] truncate">{userEmail}</p>
              </div>
            </div>

            <p className="text-[13.5px] text-[var(--muted)] leading-relaxed">
              Your job pipeline, PDF CV Vault, and candidate profile are privately isolated to your account via Supabase Row-Level Security.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncToAccount}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[13.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync local jobs & CVs to cloud account'}</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--line)] hover:bg-[var(--surface-hover)] text-[var(--danger)] text-[13.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line-subtle)]">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`py-2 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer ${
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
                className={`py-2 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Create Account
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[16px] sm:text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-[var(--muted)]">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[12.5px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[16px] sm:text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
              />
            </div>

            <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
              {mode === 'signup'
                ? 'Creating an account syncs your jobs, PDF CVs, and profile across your phone and laptop.'
                : 'Sign in to access your synced job pipeline and CV Vault from any device.'}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[14px] font-semibold transition-all cursor-pointer disabled:opacity-50"
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
