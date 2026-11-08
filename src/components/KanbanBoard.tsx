'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import { JobCard } from './JobCard';
import { STATUS_LIST } from './FilterBar';
import { Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KanbanBoardProps {
  jobs: Job[];
  todayStr: string;
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onStatusChange: (job: Job, newStatus: JobStatus) => void;
  onQuickAdd: (status: JobStatus) => void;
}

const STATUS_DOT: Record<JobStatus, string> = {
  Saved: 'bg-[var(--s-saved-dot)]',
  Applied: 'bg-[var(--s-applied-dot)]',
  Interview: 'bg-[var(--s-interview-dot)]',
  Offer: 'bg-[var(--s-offer-dot)]',
  Rejected: 'bg-[var(--s-rejected-dot)]',
  Ghosted: 'bg-[var(--s-ghosted-dot)]',
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  todayStr,
  onEditJob,
  onDeleteJob,
  onStatusChange,
  onQuickAdd,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('text/plain');
    if (!jobId) return;

    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob && targetJob.status !== targetStatus) {
      if (targetStatus === 'Offer') {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      }
      onStatusChange(targetJob, targetStatus);
    }
  };

  return (
    <div className="flex gap-3.5 overflow-x-auto pb-6 snap-x snap-mandatory sm:snap-none">
      {STATUS_LIST.map((status) => {
        const columnJobs = jobs.filter((j) => j.status === status);

        return (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            className="flex-1 min-w-[290px] sm:min-w-[280px] snap-center flex flex-col rounded-xl bg-[var(--surface-subtle)]/50 border border-[var(--line-subtle)] p-2.5 min-h-[480px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
                <h4 className="text-[14px] font-semibold text-[var(--ink)] tracking-tight">
                  {status}
                </h4>
                <span className="text-[12.5px] font-medium text-[var(--muted)] tabular-nums">
                  {columnJobs.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(status)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                title={`Add to ${status}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-2.5 flex-1">
              {columnJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', job.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <JobCard
                    job={job}
                    todayStr={todayStr}
                    onEdit={onEditJob}
                    onDelete={onDeleteJob}
                    onStatusChange={onStatusChange}
                  />
                </div>
              ))}

              {columnJobs.length === 0 && (
                <button
                  type="button"
                  onClick={() => onQuickAdd(status)}
                  className="flex-1 flex items-center justify-center p-4 text-center border border-dashed border-[var(--line)] hover:border-[var(--muted-subtle)] rounded-xl text-[13px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  + Add {status.toLowerCase()}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
