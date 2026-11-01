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
  const appliedCount = jobs.filter((j) => j.status !== 'Saved').length;
  const interviewCount = jobs.filter((j) => j.status === 'Interview' || j.status === 'Offer').length;

  const dueFollowups = todayStr
    ? jobs.filter(
        (j) =>
          j.followup_date &&
          j.followup_date <= todayStr &&
          (j.status === 'Applied' || j.status === 'Interview')
      )
    : [];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
      {/* Total */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5 transition-all">
        <b className="block text-2xl font-bold tracking-tight text-[var(--ink)] leading-none">
          {total}
        </b>
        <span className="text-xs text-[var(--muted)] font-medium mt-1 block">
          Total tracked
        </span>
      </div>

      {/* Applied */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5 transition-all">
        <b className="block text-2xl font-bold tracking-tight text-[var(--ink)] leading-none">
          {appliedCount}
        </b>
        <span className="text-xs text-[var(--muted)] font-medium mt-1 block">
          In pipeline
        </span>
      </div>

      {/* Interviews & Offers */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5 transition-all">
        <b className="block text-2xl font-bold tracking-tight text-[var(--ink)] leading-none">
          {interviewCount}
        </b>
        <span className="text-xs text-[var(--muted)] font-medium mt-1 block">
          Interviews & Offers
        </span>
      </div>

      {/* Follow-ups Due */}
      <div
        onClick={onSelectDueFilter}
        className={`bg-[var(--surface)] border rounded-xl p-3.5 transition-all cursor-pointer ${
          isDueFilterActive
            ? 'border-[var(--danger)] ring-2 ring-[var(--danger)]/20'
            : dueFollowups.length > 0
            ? 'border-[var(--danger)]/50 hover:border-[var(--danger)]'
            : 'border-[var(--line)] hover:border-[var(--muted)]'
        }`}
        title="Click to toggle filter for due follow-ups"
      >
        <b
          className={`block text-2xl font-bold tracking-tight leading-none ${
            dueFollowups.length > 0 ? 'text-[var(--danger)]' : 'text-[var(--ink)]'
          }`}
        >
          {dueFollowups.length}
        </b>
        <span
          className={`text-xs font-medium mt-1 flex items-center justify-between ${
            dueFollowups.length > 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'
          }`}
        >
          <span>Follow-ups due</span>
          {dueFollowups.length > 0 && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[var(--danger)]/10 text-[var(--danger)]">
              {isDueFilterActive ? 'Active' : 'Show'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
