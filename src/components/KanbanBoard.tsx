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
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      onStatusChange(targetJob, targetStatus);
    }
  };

  const getStatusColumnColors = (status: JobStatus) => {
    switch (status) {
      case 'Saved':
        return { dot: 'bg-slate-400', headerBg: 'bg-slate-100/60 dark:bg-slate-800/40' };
      case 'Applied':
        return { dot: 'bg-sky-500', headerBg: 'bg-sky-50/60 dark:bg-sky-950/30' };
      case 'Interview':
        return { dot: 'bg-emerald-500', headerBg: 'bg-emerald-50/60 dark:bg-emerald-950/30' };
      case 'Offer':
        return { dot: 'bg-amber-500', headerBg: 'bg-amber-50/60 dark:bg-amber-950/30' };
      case 'Rejected':
        return { dot: 'bg-rose-500', headerBg: 'bg-rose-50/60 dark:bg-rose-950/30' };
      case 'Ghosted':
        return { dot: 'bg-purple-500', headerBg: 'bg-purple-50/60 dark:bg-purple-950/30' };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start pb-8">
      {STATUS_LIST.map((status) => {
        const columnJobs = jobs.filter((j) => j.status === status);
        const { dot, headerBg } = getStatusColumnColors(status);

        return (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            className="flex flex-col rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between p-2 rounded-xl mb-3 ${headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {status}
                </h4>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                  {columnJobs.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(status)}
                className="p-1 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title={`Add job to ${status}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-3 flex-1">
              {columnJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', job.id)}
                  className="cursor-grab active:cursor-grabbing transition-transform active:scale-[0.98]"
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
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Drop cards here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
