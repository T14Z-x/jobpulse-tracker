'use client';

import React from 'react';
import { Job, JobStatus, WorkplaceType } from '@/types/job';
import { Search, LayoutGrid, Kanban, X } from 'lucide-react';

export const STATUS_LIST: JobStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];

export type ViewMode = 'board' | 'grid';
export type SortOption = 'newest' | 'applied_date' | 'followup_date' | 'company';

const STATUS_DOT: Record<JobStatus, string> = {
  Saved: 'bg-[var(--s-saved-dot)]',
  Applied: 'bg-[var(--s-applied-dot)]',
  Interview: 'bg-[var(--s-interview-dot)]',
  Offer: 'bg-[var(--s-offer-dot)]',
  Rejected: 'bg-[var(--s-rejected-dot)]',
  Ghosted: 'bg-[var(--s-ghosted-dot)]',
};

interface FilterBarProps {
  jobs: Job[];
  query: string;
  onQueryChange: (q: string) => void;
  selectedStatus: JobStatus | 'All';
  onStatusChange: (status: JobStatus | 'All') => void;
  selectedWorkplace: WorkplaceType | 'All';
  onWorkplaceChange: (wp: WorkplaceType | 'All') => void;
  viewMode: ViewMode;
  onViewModeChange: (vm: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  onlyDue: boolean;
  onToggleOnlyDue: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  jobs,
  query,
  onQueryChange,
  selectedStatus,
  onStatusChange,
  selectedWorkplace,
  onWorkplaceChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  onlyDue,
  onToggleOnlyDue,
}) => {
  const getCount = (status: JobStatus | 'All') => {
    if (status === 'All') return jobs.length;
    return jobs.filter((j) => j.status === status).length;
  };

  return (
    <div className="space-y-3 mb-5">
      {/* Search and control bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          <input
            type="search"
            placeholder="Filter by company, role, location, or note..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-14 py-2.5 sm:py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--muted)] text-[16px] sm:text-[14px] focus:outline-none focus:border-[var(--ink)] transition-colors"
          />
          {query ? (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px] font-mono text-[var(--muted-subtle)] bg-[var(--bg)] border border-[var(--line)] rounded pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Filters & View Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={selectedWorkplace}
            onChange={(e) => onWorkplaceChange(e.target.value as WorkplaceType | 'All')}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-secondary)] text-[13.5px] font-medium focus:outline-none focus:border-[var(--ink)] transition-colors cursor-pointer"
          >
            <option value="All">All workplaces</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-secondary)] text-[13.5px] font-medium focus:outline-none focus:border-[var(--ink)] transition-colors cursor-pointer"
          >
            <option value="newest">Recently added</option>
            <option value="applied_date">Applied date</option>
            <option value="followup_date">Follow-up date</option>
            <option value="company">Company A–Z</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] shrink-0">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[var(--surface-subtle)] text-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('board')}
              className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-[var(--surface-subtle)] text-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="Board View"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden md:inline">Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            onStatusChange('All');
            if (onlyDue) onToggleOnlyDue();
          }}
          className={`px-3 py-1.5 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            selectedStatus === 'All' && !onlyDue
              ? 'bg-[var(--ink)] text-[var(--bg)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span>All</span>
          <span className="text-[12px] opacity-75 tabular-nums">{getCount('All')}</span>
        </button>

        {STATUS_LIST.map((status) => {
          const isSelected = selectedStatus === status && !onlyDue;
          const count = getCount(status);
          return (
            <button
              key={status}
              onClick={() => {
                onStatusChange(status);
                if (onlyDue) onToggleOnlyDue();
              }}
              className={`px-3 py-1.5 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[var(--ink)] text-[var(--bg)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
              <span>{status}</span>
              <span className="text-[12px] opacity-70 tabular-nums">{count}</span>
            </button>
          );
        })}

        {onlyDue && (
          <button
            onClick={onToggleOnlyDue}
            className="ml-auto px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-[var(--danger-light)] text-[var(--danger)] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Due follow-ups</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
