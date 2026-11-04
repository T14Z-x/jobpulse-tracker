'use client';

import React from 'react';
import { Job } from '@/types/job';

interface StatsBarProps {
  jobs: Job[];
  todayStr: string;
  onSelectDueFilter: () => void;
  isDueFilterActive?: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  jobs,
  todayStr,
  onSelectDueFilter,
  isDueFilterActive = false,
}) => {
  const total = jobs.length;
  const activeCount = jobs.filter((j) => j.status === 'Applied' || j.status === 'Interview').length;
  const interviewCount = jobs.filter((j) => j.status === 'Interview' || j.status === 'Offer').length;
  const appliedTotal = jobs.filter((j) => j.status !== 'Saved').length;
  const responseRate = appliedTotal > 0 ? Math.round((interviewCount / appliedTotal) * 100) : 0;

  const dueFollowups = todayStr
    ? jobs.filter(
        (j) =>
          j.followup_date &&
          j.followup_date <= todayStr &&
          (j.status === 'Applied' || j.status === 'Interview')
      )
    : [];

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line-subtle)] mb-5 overflow-hidden">
      {/* Total */}
      <div className="px-4 py-3 flex items-baseline justify-between sm:block">
        <span className="text-[11px] font-medium text-[var(--muted)] block">
          Total tracked
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <b className="text-xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
            {total}
          </b>
          {total > 0 && (
            <span className="text-[11px] text-[var(--muted-subtle)] tabular-nums">
              {appliedTotal} sent
            </span>
          )}
        </div>
      </div>

      {/* Active pipeline */}
      <div className="px-4 py-3 flex items-baseline justify-between sm:block border-l sm:border-l-0 border-[var(--line-subtle)]">
        <span className="text-[11px] font-medium text-[var(--muted)] block">
          Active pipeline
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <b className="text-xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
            {activeCount}
          </b>
          <span className="text-[11px] text-[var(--muted-subtle)]">awaiting</span>
        </div>
      </div>

      {/* Interviews & Offers */}
      <div className="px-4 py-3 flex items-baseline justify-between sm:block">
        <span className="text-[11px] font-medium text-[var(--muted)] block">
          Interviews & offers
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <b className="text-xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
            {interviewCount}
          </b>
          {appliedTotal > 0 && (
            <span className="text-[11px] text-[var(--muted-subtle)] tabular-nums">
              {responseRate}% rate
            </span>
          )}
        </div>
      </div>

      {/* Follow-ups Due */}
      <button
        type="button"
        onClick={onSelectDueFilter}
        className={`px-4 py-3 text-left flex items-baseline justify-between sm:block transition-colors cursor-pointer border-l sm:border-l-0 border-[var(--line-subtle)] ${
          isDueFilterActive
            ? 'bg-[var(--danger-light)]'
            : 'hover:bg-[var(--surface-hover)]'
        }`}
        title="Filter by follow-ups due"
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[11px] font-medium ${
              dueFollowups.length > 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'
            }`}
          >
            Follow-ups due
          </span>
          {dueFollowups.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[var(--danger)]/10 text-[var(--danger)]">
              {isDueFilterActive ? 'Filtered' : 'View'}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <b
            className={`text-xl font-semibold tracking-tight tabular-nums ${
              dueFollowups.length > 0 ? 'text-[var(--danger)]' : 'text-[var(--ink)]'
            }`}
          >
            {dueFollowups.length}
          </b>
          <span className="text-[11px] text-[var(--muted-subtle)]">
            {dueFollowups.length === 1 ? 'needs action' : 'today'}
          </span>
        </div>
      </button>
    </div>
  );
};
