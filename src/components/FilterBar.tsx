'use client';

import React from 'react';
import { Job, JobStatus, WorkplaceType } from '@/types/job';
import { Search, LayoutGrid, Kanban, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

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
    <div className="space-y-4 mb-6">
      {/* Top search and view mode bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company, role, location, tech tags, or notes..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Workplace Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedWorkplace}
            onChange={(e) => onWorkplaceChange(e.target.value as WorkplaceType | 'All')}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="Remote">Remote Only</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Sort Option */}
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
          >
            <option value="newest">Sort: Recently Added</option>
            <option value="applied_date">Sort: Applied Date</option>
            <option value="followup_date">Sort: Follow-up Date</option>
            <option value="company">Sort: Company A-Z</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => onStatusChange('All')}
          className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all border ${
            selectedStatus === 'All' && !onlyDue
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All ({getCount('All')})
        </button>

        {STATUS_LIST.map((status) => {
          const isSelected = selectedStatus === status && !onlyDue;
          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {status} ({getCount(status)})
            </button>
          );
        })}

        <button
          onClick={onToggleOnlyDue}
          className={`ml-auto px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            onlyDue
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Follow-ups Due Only
        </button>
      </div>
    </div>
  );
};
