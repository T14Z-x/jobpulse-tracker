'use client';

import React from 'react';
import { Job, JobStatus, WorkplaceType } from '@/types/job';
import { Search, LayoutGrid, Kanban, X } from 'lucide-react';

export const STATUS_LIST: JobStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];

export type ViewMode = 'board' | 'grid';
export type SortOption = 'newest' | 'applied_date' | 'followup_date' | 'company';

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          <input
            type="search"
            placeholder="Search company, role, location, notes..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors shadow-2xs"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & View Switcher */}
        <div className="flex items-center gap-2">
          {/* Workplace Filter */}
          <select
            value={selectedWorkplace}
            onChange={(e) => onWorkplaceChange(e.target.value as WorkplaceType | 'All')}
            className="px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <option value="newest">Latest added</option>
            <option value="applied_date">Date applied</option>
            <option value="followup_date">Follow-up due</option>
            <option value="company">Company name</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)]">
            <button
              onClick={() => onViewModeChange('board')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pill filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <button
          onClick={() => {
            onStatusChange('All');
            if (onlyDue) onToggleOnlyDue();
          }}
          className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors border cursor-pointer ${
            selectedStatus === 'All' && !onlyDue
              ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
              : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] border-[var(--line)]'
          }`}
        >
          All ({getCount('All')})
        </button>

        {STATUS_LIST.map((status) => {
          const isSelected = selectedStatus === status && !onlyDue;
          return (
            <button
              key={status}
              onClick={() => {
                onStatusChange(status);
                if (onlyDue) onToggleOnlyDue();
              }}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                isSelected
                  ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] border-[var(--line)]'
              }`}
            >
              {status} ({getCount(status)})
            </button>
          );
        })}

        {onlyDue && (
          <button
            onClick={onToggleOnlyDue}
            className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 flex items-center gap-1 cursor-pointer"
          >
            <span>Showing due only</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
