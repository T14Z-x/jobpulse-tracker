'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import { STATUS_LIST } from './FilterBar';
import { ExternalLink, Calendar, MapPin, Image as ImageIcon, Clock, Trash2, Edit2 } from 'lucide-react';
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

  const getBorderLeftColor = (status: JobStatus) => {
    switch (status) {
      case 'Saved': return 'border-l-[#a5b2ae] dark:border-l-[#3a4e47]';
      case 'Applied': return 'border-l-[#5d9fd6] dark:border-l-[#2a557b]';
      case 'Interview': return 'border-l-[#3bb36a] dark:border-l-[#20633b]';
      case 'Offer': return 'border-l-[#dba400] dark:border-l-[#6e550e]';
      case 'Rejected': return 'border-l-[#d4624b] dark:border-l-[#682e22]';
      case 'Ghosted': return 'border-l-[#887da1] dark:border-l-[#493f5d]';
    }
  };

  const getStatusClass = (status: JobStatus) => {
    switch (status) {
      case 'Saved': return 'status-saved';
      case 'Applied': return 'status-applied';
      case 'Interview': return 'status-interview';
      case 'Offer': return 'status-offer';
      case 'Rejected': return 'status-rejected';
      case 'Ghosted': return 'status-ghosted';
    }
  };

  return (
    <div
      onClick={() => onEdit(job)}
      className={`group relative p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] border-l-5 ${getBorderLeftColor(
        job.status
      )} transition-all duration-150 hover:border-[var(--muted)]/60 cursor-pointer flex flex-col justify-between gap-2.5 shadow-2xs`}
    >
      <div>
        {/* Row 1: Company & Status Selector */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] text-[var(--ink)] leading-snug truncate">
              {job.company}
            </h3>
            <p className="text-xs text-[var(--muted)] font-medium truncate mt-0.5">
              {job.title}
            </p>
          </div>

          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <select
              value={job.status}
              onChange={handleStatusSelect}
              className={`status-badge ${getStatusClass(
                job.status
              )} focus:outline-none cursor-pointer appearance-none text-center`}
            >
              {STATUS_LIST.map((st) => (
                <option key={st} value={st} className="bg-[var(--surface)] text-[var(--ink)] font-normal">
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Follow-up banner */}
        {isDue && (
          <div className="mt-2 text-[11px] font-semibold text-[var(--danger)] flex items-center gap-1 bg-[var(--danger)]/8 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Follow-up is due</span>
          </div>
        )}

        {/* Notes preview */}
        {job.notes && (
          <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
            {job.notes}
          </p>
        )}
      </div>

      {/* Metadata strip */}
      <div className="pt-2 border-t border-[var(--line-subtle)] flex items-center justify-between text-[11px] text-[var(--muted)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {job.applied_date && (
            <span className="flex items-center gap-1" title="Date Applied">
              <Calendar className="w-3 h-3" />
              <span>{job.applied_date}</span>
            </span>
          )}

          {job.location && (
            <span className="flex items-center gap-1 truncate max-w-[120px]" title="Location">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </span>
          )}

          {job.screenshots && job.screenshots.length > 0 && (
            <span className="flex items-center gap-1 text-[var(--accent)] font-medium" title="Screenshots">
              <ImageIcon className="w-3 h-3" />
              <span>{job.screenshots.length}</span>
            </span>
          )}
        </div>

        {/* Quick actions (reveal on hover) */}
        <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {job.link && (
            <a
              href={job.link}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
              title="Open job link"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => onEdit(job)}
            className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="p-1 rounded text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-subtle)] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
