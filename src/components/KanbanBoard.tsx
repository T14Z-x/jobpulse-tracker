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

  const getStatusDotColor = (status: JobStatus) => {
    switch (status) {
      case 'Saved': return 'bg-[#a5b2ae] dark:bg-[#526a62]';
      case 'Applied': return 'bg-[#5d9fd6] dark:bg-[#3d7099]';
      case 'Interview': return 'bg-[#3bb36a] dark:bg-[#2e7d4d]';
      case 'Offer': return 'bg-[#dba400] dark:bg-[#997405]';
      case 'Rejected': return 'bg-[#d4624b] dark:bg-[#914131]';
      case 'Ghosted': return 'bg-[#887da1] dark:bg-[#5e5373]';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start pb-8">
      {STATUS_LIST.map((status) => {
        const columnJobs = jobs.filter((j) => j.status === status);

        return (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            className="flex flex-col rounded-xl bg-[var(--surface-subtle)]/70 border border-[var(--line)] p-2.5 min-h-[460px] transition-colors"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`} />
                <h4 className="text-xs font-bold text-[var(--ink)] tracking-tight">
                  {status}
                </h4>
                <span className="text-[11px] font-semibold text-[var(--muted)]">
                  {columnJobs.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(status)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                title={`Add to ${status}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards */}
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
                <div className="flex-1 flex items-center justify-center p-4 text-center border border-dashed border-[var(--line)] rounded-lg">
                  <p className="text-[11px] text-[var(--muted)]">No jobs</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
