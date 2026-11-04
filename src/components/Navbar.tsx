'use client';

import React from 'react';
import { Plus, Database, Download, Sun, Moon, Briefcase, Compass, FileText } from 'lucide-react';

export type WorkspaceTab = 'pipeline' | 'discover';

interface NavbarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  pipelineCount: number;
  source: 'supabase' | 'local';
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenCvVaultModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenImportExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  pipelineCount,
  source,
  darkMode,
  onToggleTheme,
  onOpenAddModal,
  onOpenCvVaultModal,
  onOpenDatabaseModal,
  onOpenImportExportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        {/* Brand + Primary Navigation Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span className="text-[14px] font-semibold text-[var(--ink)] tracking-tight hidden sm:inline">
              Pipeline
            </span>
          </div>

          <span className="text-[var(--line)] select-none hidden sm:inline">/</span>

          {/* Workspace Switcher: Pipeline vs Discover Live Jobs */}
          <nav className="flex items-center p-0.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line-subtle)]">
            <button
              type="button"
              onClick={() => onTabChange('pipeline')}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <span>My Pipeline</span>
              <span className="text-[11px] opacity-65 tabular-nums">{pipelineCount}</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('discover')}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discover Jobs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live BD & Remote Feeds" />
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* CV Vault & Quick-Copy Profile */}
          <button
            onClick={onOpenCvVaultModal}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--muted-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="CV Vault & Candidate Quick-Copy Profile"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>CV Vault</span>
          </button>

          <button
            onClick={onOpenDatabaseModal}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] text-[12px] font-medium transition-colors cursor-pointer"
            title={source === 'supabase' ? 'Synced with Supabase Cloud' : 'Stored locally in browser'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                source === 'supabase' ? 'bg-emerald-500' : 'bg-[var(--muted-subtle)]'
              }`}
            />
            <Database className="w-3.5 h-3.5" />
            <span>{source === 'supabase' ? 'Cloud' : 'Local'}</span>
          </button>

          <button
            onClick={onOpenImportExportModal}
            className="px-2.5 py-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Backup & Export"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Export</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="w-px h-4 bg-[var(--line)] mx-0.5 hidden sm:block" />

          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.99] text-[var(--accent-ink)] font-medium text-[12px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">New job</span>
            <kbd className="hidden md:inline-block ml-1 px-1 py-0.2 text-[10px] font-mono opacity-60 border border-current/25 rounded">
              N
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
