'use client';

import React from 'react';
import { Plus, Database, Download, Sun, Moon, Briefcase, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                JobTracker<span className="text-emerald-500">.pro</span>
              </span>
              <span
                onClick={onOpenDatabaseModal}
                className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  source === 'supabase'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:ring-2 hover:ring-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-slate-400'
                }`}
                title={source === 'supabase' ? 'Synced with Supabase Cloud' : 'Click to connect Supabase'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${source === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {source === 'supabase' ? 'Supabase Connected' : 'Local Storage'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Every application, status & posting screenshot in one place
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Database Config */}
          <button
            onClick={onOpenDatabaseModal}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Database Connection"
          >
            <Database className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="hidden md:inline">Database</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExportModal}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Backup & Restore"
          >
            <Download className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="hidden md:inline">Export / Import</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Add Job CTA */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Job</span>
          </button>
        </div>
      </div>
    </header>
  );
};
