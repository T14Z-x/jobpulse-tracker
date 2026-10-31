'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import { STATUS_LIST } from './FilterBar';
import { ExternalLink, Calendar, MapPin, DollarSign, Image as ImageIcon, Clock, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface JobCardProps {
  job: Job;
  todayStr?: string;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onStatusChange: (job: Job, newStatus: JobStatus) => void;
  onOpenScreenshot?: (imageUrl: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  todayStr = '',
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const isDue = Boolean(todayStr && job.followup_date && job.followup_date <= todayStr && (job.status === 'Applied' || job.status === 'Interview'));
  const isOverdue = Boolean(todayStr && job.followup_date && job.followup_date < todayStr && (job.status === 'Applied' || job.status === 'Interview'));

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const nextStatus = e.target.value as JobStatus;
    if (nextStatus === 'Offer') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    onStatusChange(job, nextStatus);
  };

  const getStatusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case 'Saved': return 'badge-saved';
      case 'Applied': return 'badge-applied';
      case 'Interview': return 'badge-interview';
      case 'Offer': return 'badge-offer';
      case 'Rejected': return 'badge-rejected';
      case 'Ghosted': return 'badge-ghosted';
    }
  };

  return (
    <div
      onClick={() => onEdit(job)}
      className={`group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500/50 flex flex-col justify-between gap-3 ${
        isDue ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-300/50' : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div>
        {/* Top Header: Company & Status Selector */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {job.company}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {job.title}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <select
              value={job.status}
              onChange={handleStatusSelect}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none cursor-pointer transition-colors ${getStatusBadgeClass(job.status)}`}
            >
              {STATUS_LIST.map((st) => (
                <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due follow-up alert pill */}
        {isDue && (
          <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5 animate-pulse-subtle">
            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{isOverdue ? 'Follow-up is overdue!' : 'Follow-up is due today!'}</span>
          </div>
        )}

        {/* Tags & Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {job.workplace && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700">
              {job.workplace}
            </span>
          )}
          {job.location && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 border border-slate-200/60 dark:border-slate-700 truncate max-w-[160px]">
              <MapPin className="w-3 h-3 shrink-0" /> {job.location}
            </span>
          )}
          {job.salary && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/50">
              <DollarSign className="w-3 h-3 shrink-0" /> {job.salary}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {job.notes && (
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {job.notes}
          </p>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          {job.applied_date ? (
            <span className="flex items-center gap-1" title="Date Applied">
              <Calendar className="w-3.5 h-3.5" /> {job.applied_date}
            </span>
          ) : (
            <span className="text-slate-400">Not applied yet</span>
          )}
          {job.screenshots && job.screenshots.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium" title="Screenshots saved">
              <ImageIcon className="w-3.5 h-3.5" /> {job.screenshots.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {job.link && (
            <a
              href={job.link}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Open Job Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onEdit(job)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Edit Application"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            title="Delete Application"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
