'use client';

import React from 'react';
import { Plus, Database, Download, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  source: 'supabase' | 'local';
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenImportExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  source,
  darkMode,
  onToggleTheme,
  onOpenAddModal,
  onOpenDatabaseModal,
  onOpenImportExportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            JT
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[var(--ink)] tracking-tight">
              Job Tracker
            </h1>
            <button
              onClick={onOpenDatabaseModal}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-[var(--line)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              title={source === 'supabase' ? 'Synced with Supabase Cloud' : 'Running locally in-browser'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  source === 'supabase' ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'
                }`}
              />
              <span>{source === 'supabase' ? 'Supabase' : 'Local'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Database Config */}
          <button
            onClick={onOpenDatabaseModal}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-subtle)] text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Database Connection"
          >
            <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Database</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExportModal}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-subtle)] text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Backup & Restore"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-subtle)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* New Job CTA */}
          <button
            onClick={onOpenAddModal}
            className="ml-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] text-[var(--accent-ink)] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add job</span>
          </button>
        </div>
      </div>
    </header>
  );
};
