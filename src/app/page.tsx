'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Job, JobStatus, WorkplaceType } from '@/types/job';
import { fetchAllJobs, saveJobToStorage, deleteJobFromStorage } from '@/lib/storage';
import { Navbar, WorkspaceTab } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar, ViewMode, SortOption } from '@/components/FilterBar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { JobCard } from '@/components/JobCard';
import { DiscoverFeed } from '@/components/DiscoverFeed';
import { JobModal } from '@/components/JobModal';
import { DatabaseModal } from '@/components/DatabaseModal';
import { ImportExportModal } from '@/components/ImportExportModal';
import { ScreenshotLightbox } from '@/components/ScreenshotLightbox';
import { Toast, ToastMessage } from '@/components/Toast';
import { Plus, SlidersHorizontal, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('pipeline');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [source, setSource] = useState<'supabase' | 'local'>('local');
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState('');

  // Theme
  const [darkMode, setDarkMode] = useState(false);

  // Quick-add inline bar state
  const [quickCompany, setQuickCompany] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickLink, setQuickLink] = useState('');

  // Filters & Views
  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'All'>('All');
  const [selectedWorkplace, setSelectedWorkplace] = useState<WorkplaceType | 'All'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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
    }, 3000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load & Theme
  useEffect(() => {
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setTodayStr(new Date().toISOString().slice(0, 10));
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
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === 'n' && !isJobModalOpen && !isDatabaseModalOpen && !isImportExportModalOpen) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
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
      addToast('success', `${job.status === 'Saved' ? 'Saved' : 'Logged'} ${job.company}`);
      if (job.status === 'Offer') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
      addToast('success', `Updated ${job.company}`);
    }

    if (res.source === 'supabase') {
      setSource('supabase');
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCompany.trim() || !quickTitle.trim()) return;

    const curToday = new Date().toISOString().slice(0, 10);
    const fDate = new Date();
    fDate.setDate(fDate.getDate() + 7);

    const newJob: Job = {
      id: 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      company: quickCompany.trim(),
      title: quickTitle.trim(),
      link: quickLink.trim() || undefined,
      status: selectedStatus !== 'All' ? selectedStatus : 'Applied',
      workplace: 'Remote',
      type: 'Full-time',
      applied_date: curToday,
      followup_date: fDate.toISOString().slice(0, 10),
      created_at: Date.now(),
    };

    setQuickCompany('');
    setQuickTitle('');
    setQuickLink('');
    await handleSaveJob(newJob);
  };

  const handleDeleteJob = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    await deleteJobFromStorage(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    addToast('info', `Removed ${target?.company || 'application'}`);
  };

  const handleStatusChange = async (job: Job, newStatus: JobStatus) => {
    const updatedJob: Job = { ...job, status: newStatus };
    const curToday = new Date().toISOString().slice(0, 10);

    if (newStatus === 'Applied' && !updatedJob.applied_date) {
      updatedJob.applied_date = curToday;
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + 7);
      updatedJob.followup_date = fDate.toISOString().slice(0, 10);
    }

    await saveJobToStorage(updatedJob);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)));
    addToast('success', `${job.company} → ${newStatus}`);
  };

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    const q = query.toLowerCase().trim();

    return jobs
      .filter((j) => {
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

        if (selectedStatus !== 'All' && j.status !== selectedStatus) {
          return false;
        }

        if (selectedWorkplace !== 'All' && j.workplace !== selectedWorkplace) {
          return false;
        }

        if (onlyDue) {
          const isDue =
            todayStr &&
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
  }, [jobs, query, selectedStatus, selectedWorkplace, onlyDue, sortOption, todayStr]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pipelineCount={jobs.length}
        source={source}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => handleOpenAddModal('Applied')}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'discover' ? (
          <DiscoverFeed
            existingJobs={jobs}
            onSaveToPipeline={handleSaveJob}
            onNotify={addToast}
          />
        ) : (
          <>
            {/* Stats Ledger Strip */}
            <StatsBar
              jobs={jobs}
              todayStr={todayStr}
              isDueFilterActive={onlyDue}
              onSelectDueFilter={() => {
                setOnlyDue((prev) => !prev);
                if (!onlyDue) {
                  setSelectedStatus('All');
                }
              }}
            />

            {/* Inline 2-Field Quick Capture Bar */}
            <form
              onSubmit={handleQuickAddSubmit}
              className="mb-5 p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 shadow-2xs"
            >
              <input
                type="text"
                placeholder="Quick log: Company (e.g. Linear)"
                value={quickCompany}
                onChange={(e) => setQuickCompany(e.target.value)}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-transparent text-[13px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:bg-[var(--bg)]"
              />
              <div className="hidden sm:block w-px h-4 bg-[var(--line-subtle)]" />
              <input
                type="text"
                placeholder="Role (e.g. Product Engineer)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-transparent text-[13px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:bg-[var(--bg)]"
              />
              <div className="hidden md:block w-px h-4 bg-[var(--line-subtle)]" />
              <input
                type="url"
                placeholder="URL (optional)"
                value={quickLink}
                onChange={(e) => setQuickLink(e.target.value)}
                className="hidden md:block w-48 px-3 py-1.5 rounded-lg bg-transparent text-[13px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:bg-[var(--bg)]"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('Applied')}
                  className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open full form with screenshots & notes"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">More</span>
                </button>
                <button
                  type="submit"
                  disabled={!quickCompany.trim() || !quickTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] text-[12px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-35"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              </div>
            </form>

            {/* Filter bar */}
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

            {/* Content View: Board vs Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <p className="text-[12px] text-[var(--muted)]">Loading pipeline...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-16 px-4 text-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/50 my-2">
                <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                  {jobs.length ? 'No matching applications' : 'Your pipeline is empty'}
                </h3>
                <p className="text-[12px] text-[var(--muted)] mt-1 max-w-sm mx-auto">
                  {jobs.length
                    ? 'Try clearing your search query or stage filter.'
                    : 'Browse live Bangladesh & International Remote roles in the Discover Jobs tab, or log one above.'}
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
                      className="px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors border border-[var(--line)] cursor-pointer"
                    >
                      Clear filters
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="px-3.5 py-1.5 text-[12px] font-medium bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Discover Live Jobs</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
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
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-[var(--line-subtle)] py-4 text-xs text-[var(--muted)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>Local-first storage · Press N for new job, ⌘K to search</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Cloud sync
            </button>
            <span>·</span>
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Backup & CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
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

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
