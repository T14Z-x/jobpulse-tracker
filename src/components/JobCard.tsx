'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import { STATUS_LIST } from './FilterBar';
import { getScreenshot } from '@/lib/idb';
import { ExternalLink, Image as ImageIcon, Clock, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface JobCardProps {
  job: Job;
  todayStr?: string;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onStatusChange: (job: Job, newStatus: JobStatus) => void;
  onOpenScreenshot?: (imageUrl: string) => void;
}

const STATUS_DOT: Record<JobStatus, string> = {
  Saved: 'bg-[var(--s-saved-dot)]',
  Applied: 'bg-[var(--s-applied-dot)]',
  Interview: 'bg-[var(--s-interview-dot)]',
  Offer: 'bg-[var(--s-offer-dot)]',
  Rejected: 'bg-[var(--s-rejected-dot)]',
  Ghosted: 'bg-[var(--s-ghosted-dot)]',
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  todayStr = '',
  onEdit,
  onDelete,
  onStatusChange,
  onOpenScreenshot,
}) => {
  const isDue = Boolean(
    todayStr &&
      job.followup_date &&
      job.followup_date <= todayStr &&
      (job.status === 'Applied' || job.status === 'Interview')
  );

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const nextStatus = e.target.value as JobStatus;
    if (nextStatus === 'Offer') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
    onStatusChange(job, nextStatus);
  };

  const handlePreviewScreenshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onOpenScreenshot || !job.screenshots?.length) return;
    const first = await getScreenshot(job.screenshots[0]);
    if (first) onOpenScreenshot(first);
  };

  const getStatusClass = (status: JobStatus) => {
    switch (status) {
      case 'Saved':
        return 'status-saved';
      case 'Applied':
        return 'status-applied';
      case 'Interview':
        return 'status-interview';
      case 'Offer':
        return 'status-offer';
      case 'Rejected':
        return 'status-rejected';
      case 'Ghosted':
        return 'status-ghosted';
    }
  };

  const fmtDate = (str?: string) => {
    if (!str) return '';
    try {
      const parts = str.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const date = new Date(+y, +m - 1, +d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return str;
    } catch {
      return str;
    }
  };

  const initial = (job.company || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onEdit(job)}
      className="group relative p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--muted-subtle)] transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3"
    >
      <div>
        {/* Top Row: Avatar + Company/Role + Stage Selector */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line-subtle)] text-[var(--ink-secondary)] font-semibold text-[13px] flex items-center justify-center shrink-0 select-none">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-[14px] text-[var(--ink)] leading-snug truncate">
                  {job.company}
                </h3>
                {job.link && (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--muted-subtle)] hover:text-[var(--ink)] transition-colors shrink-0"
                    title="Open job posting"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[12px] text-[var(--muted)] truncate mt-0.5">
                {job.title}
              </p>
            </div>
          </div>

          {/* Stage Selector Pill */}
          <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
            <div className={`status-badge ${getStatusClass(job.status)} relative`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
              <select
                value={job.status}
                onChange={handleStatusSelect}
                aria-label="Application stage"
                className="bg-transparent font-medium text-[11px] focus:outline-none cursor-pointer appearance-none pr-0.5"
              >
                {STATUS_LIST.map((st) => (
                  <option
                    key={st}
                    value={st}
                    className="bg-[var(--surface)] text-[var(--ink)] font-normal"
                  >
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Optional Metadata Pills (Salary / Location) */}
        {(job.salary || job.location || isDue) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {isDue && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--danger-light)] text-[var(--danger)] tabular-nums">
                <Clock className="w-3 h-3 shrink-0" />
                Follow up {job.followup_date ? fmtDate(job.followup_date) : 'due'}
              </span>
            )}
            {job.salary && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-secondary)] text-[11px] font-medium tabular-nums">
                {job.salary}
              </span>
            )}
            {job.location && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--muted)] text-[11px] truncate max-w-[140px]">
                {job.location}
              </span>
            )}
          </div>
        )}

        {/* Notes preview */}
        {job.notes && (
          <p className="mt-2 text-[12px] text-[var(--muted)] line-clamp-2 leading-relaxed">
            {job.notes}
          </p>
        )}
      </div>

      {/* Footer Strip */}
      <div className="pt-2.5 border-t border-[var(--line-subtle)] flex items-center justify-between text-[11px] text-[var(--muted)] tabular-nums">
        <div className="flex items-center gap-2.5">
          {job.applied_date ? (
            <span>Applied {fmtDate(job.applied_date)}</span>
          ) : (
            <span>Added {fmtDate(new Date(job.created_at).toISOString().slice(0, 10))}</span>
          )}

          {job.screenshots && job.screenshots.length > 0 && (
            <button
              type="button"
              onClick={handlePreviewScreenshot}
              className="inline-flex items-center gap-1 text-[var(--ink-secondary)] hover:text-[var(--ink)] font-medium cursor-pointer"
              title="View screenshot"
            >
              <ImageIcon className="w-3 h-3" />
              <span>{job.screenshots.length}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--muted-subtle)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          title="Delete application"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
