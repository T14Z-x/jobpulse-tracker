'use client';

import React from 'react';
import {
  Plus,
  Database,
  Download,
  Sun,
  Moon,
  Activity,
  Compass,
  FileText,
  User,
} from 'lucide-react';

export type WorkspaceTab = 'pipeline' | 'discover';

interface NavbarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  pipelineCount: number;
  source: 'supabase' | 'local';
  userEmail: string | null;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenCvVaultModal: () => void;
  onOpenAuthModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenImportExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  pipelineCount,
  source,
  userEmail,
  darkMode,
  onToggleTheme,
  onOpenAddModal,
  onOpenCvVaultModal,
  onOpenAuthModal,
  onOpenDatabaseModal,
  onOpenImportExportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-md">
      {/* Primary Top Bar */}
      <div className="w-full px-3.5 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand + Desktop Workspace Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center shadow-2xs">
              <Activity className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-[15px] sm:text-[16px] font-bold text-[var(--ink)] tracking-tight">
              JobPulse
            </span>
          </div>

          {/* Mobile Cloud Status Dot */}
          <button
            type="button"
            onClick={onOpenDatabaseModal}
            className="md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--line-subtle)] text-[11.5px] font-medium text-[var(--muted)]"
            title={source === 'supabase' ? 'Synced with Supabase Cloud' : 'Stored locally'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                source === 'supabase' ? 'bg-emerald-500' : 'bg-[var(--muted-subtle)]'
              }`}
            />
            <span>{source === 'supabase' ? 'Cloud' : 'Local'}</span>
          </button>

          <span className="text-[var(--line)] select-none hidden md:inline">/</span>

          {/* Desktop Workspace Switcher */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line-subtle)]">
            <button
              type="button"
              onClick={() => onTabChange('pipeline')}
              className={`px-3.5 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <span>My Pipeline</span>
              <span className="text-[12px] px-1.5 py-0.2 rounded-md bg-[var(--surface-subtle)] text-[var(--ink-secondary)] tabular-nums">
                {pipelineCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('discover')}
              className={`px-3.5 py-1.5 rounded-lg text-[13.5px] font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover Jobs</span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500"
                title="Live Bangladesh & Remote Feeds"
              />
            </button>
          </nav>
        </div>

        {/* Right Action Controls (Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* CV Vault & Quick-Copy Profile */}
          <button
            onClick={onOpenCvVaultModal}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[var(--line)] hover:border-[var(--muted-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] text-[13px] sm:text-[13.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="CV Vault & Candidate Quick-Copy Profile"
          >
            <FileText className="w-4 h-4 text-[var(--muted)] shrink-0" />
            <span className="hidden xs:inline sm:inline">CV Vault</span>
            <span className="xs:hidden sm:hidden">CV</span>
          </button>

          {/* User Account / Sign In */}
          <button
            onClick={onOpenAuthModal}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[var(--line)] hover:border-[var(--muted-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] text-[13px] sm:text-[13.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title={userEmail ? `Signed in as ${userEmail}` : 'Sign in or create a cloud account'}
          >
            <User
              className={`w-4 h-4 shrink-0 ${
                userEmail ? 'text-emerald-500' : 'text-[var(--muted)]'
              }`}
            />
            <span className="max-w-[76px] sm:max-w-[120px] truncate">
              {userEmail ? userEmail.split('@')[0] : 'Sign in'}
            </span>
          </button>

          {/* Desktop Cloud / Local Button */}
          <button
            onClick={onOpenDatabaseModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] text-[13.5px] font-medium transition-colors cursor-pointer"
            title={source === 'supabase' ? 'Synced with Supabase Cloud' : 'Stored locally in browser'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                source === 'supabase' ? 'bg-emerald-500' : 'bg-[var(--muted-subtle)]'
              }`}
            />
            <Database className="w-4 h-4" />
            <span>{source === 'supabase' ? 'Cloud' : 'Local'}</span>
          </button>

          {/* Export / Backup */}
          <button
            onClick={onOpenImportExportModal}
            className="hidden sm:inline-flex px-2.5 sm:px-3 py-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] text-[13.5px] font-medium items-center gap-1.5 transition-colors cursor-pointer"
            title="Backup & Export"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Export</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="w-px h-5 bg-[var(--line)] mx-0.5 hidden sm:block" />

          {/* Primary Add Application CTA */}
          <button
            onClick={onOpenAddModal}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.99] text-[var(--accent-ink)] font-semibold text-[13px] sm:text-[13.5px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.4]" />
            <span className="hidden sm:inline">New job</span>
            <span className="sm:hidden">New</span>
            <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.2 text-[11px] font-mono opacity-65 border border-current/25 rounded">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Dedicated Mobile Second Row: Full-Width Workspace Switcher (< 768px) */}
      <div className="md:hidden px-3.5 pb-2.5 pt-0.5">
        <nav className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line-subtle)]">
          <button
            type="button"
            onClick={() => onTabChange('pipeline')}
            className={`py-2 px-3 rounded-lg text-[13.5px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <span>My Pipeline</span>
            <span className="text-[12px] px-1.5 py-0.2 rounded-md bg-[var(--surface-subtle)] text-[var(--ink-secondary)] tabular-nums">
              {pipelineCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('discover')}
            className={`py-2 px-3 rounded-lg text-[13.5px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover Jobs</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </nav>
      </div>
    </header>
  );
};
