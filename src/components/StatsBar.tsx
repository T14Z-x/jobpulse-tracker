'use client';

import React from 'react';
import { Job } from '@/types/job';
import { Briefcase, Send, Users, Trophy, Clock, TrendingUp } from 'lucide-react';

interface StatsBarProps {
  jobs: Job[];
  todayStr: string;
  onSelectDueFilter: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ jobs, todayStr, onSelectDueFilter }) => {
  const total = jobs.length;
  const appliedCount = jobs.filter((j) => j.status === 'Applied').length;
  const interviewCount = jobs.filter((j) => j.status === 'Interview').length;
  const offerCount = jobs.filter((j) => j.status === 'Offer').length;

  const dueFollowups = todayStr
    ? jobs.filter(
        (j) =>
          j.followup_date &&
          j.followup_date <= todayStr &&
          (j.status === 'Applied' || j.status === 'Interview')
      )
    : [];

  const conversionRate = appliedCount + interviewCount + offerCount > 0
    ? Math.round(((interviewCount + offerCount) / (appliedCount + interviewCount + offerCount)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Total */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tracked</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

      {/* Applied */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Applied</span>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">{appliedCount}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
          <Send className="w-5 h-5" />
        </div>
      </div>

      {/* Interviews */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Interviews</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{interviewCount}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Offers */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Offers</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{offerCount}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
          <Trophy className="w-5 h-5" />
        </div>
      </div>

      {/* Follow-ups Due */}
      <div
        onClick={onSelectDueFilter}
        className={`cursor-pointer col-span-2 sm:col-span-1 p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:ring-2 hover:ring-offset-1 ${
          dueFollowups.length > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:ring-rose-400'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:ring-slate-400'
        }`}
        title={dueFollowups.length > 0 ? 'Click to filter jobs with follow-up due' : 'No follow-ups due'}
      >
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Follow-ups Due</span>
          <p
            className={`text-2xl font-bold mt-0.5 ${
              dueFollowups.length > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-white'
            }`}
          >
            {dueFollowups.length}
          </p>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            dueFollowups.length > 0
              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
