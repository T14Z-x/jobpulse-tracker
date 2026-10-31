'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Job, JobStatus, WorkplaceType } from '@/types/job';
import { fetchAllJobs, saveJobToStorage, deleteJobFromStorage } from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar, ViewMode, SortOption } from '@/components/FilterBar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import { DatabaseModal } from '@/components/DatabaseModal';
import { ImportExportModal } from '@/components/ImportExportModal';
import { ScreenshotLightbox } from '@/components/ScreenshotLightbox';
import { Toast, ToastMessage } from '@/components/Toast';
import { Plus, Briefcase, Sparkles, FilterX } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [source, setSource] = useState<'supabase' | 'local'>('local');
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState('');

  // Theme
  const [darkMode, setDarkMode] = useState(false);

  // Filters & Views
  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'All'>('All');
  const [selectedWorkplace, setSelectedWorkplace] = useState<WorkplaceType | 'All'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [onlyDue, setOnlyDue] = useState(false);

  // Modal States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [modalInitialStatus, setModalInitialStatus] = useState<JobStatus>('Applied');
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load & Theme
  useEffect(() => {
    // Check dark mode
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set today string safely on client
    setTodayStr(new Date().toISOString().slice(0, 10));

    // Load initial jobs
    loadAllData();
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    const result = await fetchAllJobs();
    setJobs(result.jobs);
    setSource(result.source);
    setLoading(false);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === 'n' && !isJobModalOpen && !isDatabaseModalOpen && !isImportExportModalOpen) {
        // Only if not focused on an input
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleOpenAddModal('Applied');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJobModalOpen, isDatabaseModalOpen, isImportExportModalOpen]);

  const handleOpenAddModal = (status: JobStatus = 'Applied') => {
    setEditingJob(null);
    setModalInitialStatus(status);
    setIsJobModalOpen(true);
  };

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (job: Job) => {
    const isNew = !jobs.some((j) => j.id === job.id);
    const res = await saveJobToStorage(job);

    if (isNew) {
      setJobs((prev) => [job, ...prev]);
      addToast('success', `Added ${job.company} application!`);
      if (job.status === 'Offer') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
      addToast('success', `Updated ${job.company} details.`);
    }

    if (res.source === 'supabase') {
      setSource('supabase');
    }
  };

  const handleDeleteJob = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    await deleteJobFromStorage(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    addToast('info', `Removed ${target?.company || 'application'}.`);
  };

  const handleStatusChange = async (job: Job, newStatus: JobStatus) => {
    const updatedJob: Job = { ...job, status: newStatus };
    const todayStr = new Date().toISOString().slice(0, 10);

    // Auto set applied date if moving from Saved to Applied
    if (newStatus === 'Applied' && !updatedJob.applied_date) {
      updatedJob.applied_date = todayStr;
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + 7);
      updatedJob.followup_date = fDate.toISOString().slice(0, 10);
    }

    await saveJobToStorage(updatedJob);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)));
    addToast('success', `Moved ${job.company} to ${newStatus}`);
  };

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    const q = query.toLowerCase().trim();

    return jobs
      .filter((j) => {
        // Search text matching
        if (q) {
          const matchCompany = j.company.toLowerCase().includes(q);
          const matchTitle = j.title.toLowerCase().includes(q);
          const matchLocation = j.location?.toLowerCase().includes(q);
          const matchNotes = j.notes?.toLowerCase().includes(q);
          const matchContact = j.contact_name?.toLowerCase().includes(q);
          const matchTags = j.tags?.some((t) => t.toLowerCase().includes(q));

          if (!matchCompany && !matchTitle && !matchLocation && !matchNotes && !matchContact && !matchTags) {
            return false;
          }
        }

        // Status Filter
        if (selectedStatus !== 'All' && j.status !== selectedStatus) {
          return false;
        }

        // Workplace Filter
        if (selectedWorkplace !== 'All' && j.workplace !== selectedWorkplace) {
          return false;
        }

        // Due Filter
        if (onlyDue) {
          const isDue =
            j.followup_date &&
            j.followup_date <= todayStr &&
            (j.status === 'Applied' || j.status === 'Interview');
          if (!isDue) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') {
          return b.created_at - a.created_at;
        }
        if (sortOption === 'applied_date') {
          return (b.applied_date || '').localeCompare(a.applied_date || '');
        }
        if (sortOption === 'followup_date') {
          return (a.followup_date || '9999').localeCompare(b.followup_date || '9999');
        }
        if (sortOption === 'company') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [jobs, query, selectedStatus, selectedWorkplace, onlyDue, sortOption]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Top Navigation */}
      <Navbar
        source={source}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => handleOpenAddModal('Applied')}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Application Pipeline
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organize, track interview stages, save posting screenshots, and stay on top of follow-ups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddModal('Applied')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Application</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-700/60 rounded">N</kbd>
            </button>
          </div>
        </div>

        {/* Stats Metrics Counter Bar */}
        <StatsBar
          jobs={jobs}
          todayStr={todayStr}
          onSelectDueFilter={() => {
            setOnlyDue((prev) => !prev);
            if (!onlyDue) {
              setSelectedStatus('All');
            }
          }}
        />

        {/* Filter & View Switcher */}
        <FilterBar
          jobs={jobs}
          query={query}
          onQueryChange={setQuery}
          selectedStatus={selectedStatus}
          onStatusChange={(st) => {
            setSelectedStatus(st);
            setOnlyDue(false);
          }}
          selectedWorkplace={selectedWorkplace}
          onWorkplaceChange={setSelectedWorkplace}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortChange={setSortOption}
          onlyDue={onlyDue}
          onToggleOnlyDue={() => setOnlyDue((prev) => !prev)}
        />

        {/* Content Body: Kanban Board vs Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500">Loading your applications...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 my-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FilterX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No matching applications found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Try adjusting your search criteria, reset status filters, or log a new job application.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(query || selectedStatus !== 'All' || selectedWorkplace !== 'All' || onlyDue) && (
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedStatus('All');
                    setSelectedWorkplace('All');
                    setOnlyDue(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={() => handleOpenAddModal('Applied')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
              >
                + Add First Job
              </button>
            </div>
          </div>
        ) : viewMode === 'board' ? (
          <KanbanBoard
            jobs={filteredJobs}
            todayStr={todayStr}
            onEditJob={handleOpenEditModal}
            onDeleteJob={handleDeleteJob}
            onStatusChange={handleStatusChange}
            onQuickAdd={(st) => handleOpenAddModal(st)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                todayStr={todayStr}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteJob}
                onStatusChange={handleStatusChange}
                onOpenScreenshot={(url) => setLightboxImage(url)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            JobTracker.pro — Built for Vercel deployment with Supabase & offline-first storage.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Supabase Settings
            </button>
            <span>•</span>
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="text-slate-600 dark:text-slate-300 hover:underline"
            >
              Backup & Export
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Popups */}
      <JobModal
        isOpen={isJobModalOpen}
        job={editingJob}
        initialStatus={modalInitialStatus}
        onClose={() => setIsJobModalOpen(false)}
        onSave={handleSaveJob}
        onDelete={handleDeleteJob}
        onViewScreenshot={(url) => setLightboxImage(url)}
        onNotify={addToast}
      />

      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onRefreshData={loadAllData}
        onNotify={addToast}
      />

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onDataImported={loadAllData}
        onNotify={addToast}
      />

      <ScreenshotLightbox
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* Dynamic Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
