'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus, WorkplaceType } from '@/types/job';
import { STATUS_LIST } from './FilterBar';
import { saveScreenshot, getScreenshot, compressImage } from '@/lib/idb';
import {
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface JobModalProps {
  isOpen: boolean;
  job: Job | null;
  initialStatus?: JobStatus;
  onClose: () => void;
  onSave: (job: Job) => void;
  onDelete?: (id: string) => void;
  onViewScreenshot: (imageUrl: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface LoadedScreenshot {
  id: string;
  data: string;
  isNew?: boolean;
}

const STATUS_DOT: Record<JobStatus, string> = {
  Saved: 'bg-[var(--s-saved-dot)]',
  Applied: 'bg-[var(--s-applied-dot)]',
  Interview: 'bg-[var(--s-interview-dot)]',
  Offer: 'bg-[var(--s-offer-dot)]',
  Rejected: 'bg-[var(--s-rejected-dot)]',
  Ghosted: 'bg-[var(--s-ghosted-dot)]',
};

function inferCompanyFromUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    const host = u.hostname.replace(/^www\./, '');
    const parts = u.pathname.split('/').filter(Boolean);
    if (
      (host.includes('lever.co') ||
        host.includes('greenhouse.io') ||
        host.includes('ashbyhq.com') ||
        host.includes('workable.com')) &&
      parts[0]
    ) {
      return parts[0]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    const domainCore = host.split('.')[0];
    if (
      domainCore &&
      !['linkedin', 'indeed', 'glassdoor', 'wellfound', 'ycombinator', 'jobs', 'careers', 'boards'].includes(
        domainCore.toLowerCase()
      )
    ) {
      return domainCore.charAt(0).toUpperCase() + domainCore.slice(1);
    }
  } catch {
    // ignore invalid URL
  }
  return '';
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  job,
  initialStatus = 'Applied',
  onClose,
  onSave,
  onDelete,
  onViewScreenshot,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshots, setScreenshots] = useState<LoadedScreenshot[]>([]);

  // Optional progressive-disclosure fields
  const [showMore, setShowMore] = useState(false);
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [workplace, setWorkplace] = useState<WorkplaceType>('Remote');
  const [appliedDate, setAppliedDate] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [contactName, setContactName] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayStr = () => new Date().toISOString().slice(0, 10);
  const addDays = (days: number, fromDate?: string) => {
    const base = fromDate ? new Date(fromDate + 'T00:00:00') : new Date();
    base.setDate(base.getDate() + days);
    return base.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (job) {
      setCompany(job.company || '');
      setTitle(job.title || '');
      setStatus(job.status || 'Applied');
      setLink(job.link || '');
      setNotes(job.notes || '');
      setSalary(job.salary || '');
      setLocation(job.location || '');
      setWorkplace(job.workplace || 'Remote');
      setAppliedDate(job.applied_date || '');
      setFollowupDate(job.followup_date || '');
      setContactName(job.contact_name || '');

      const hasExtra = Boolean(job.salary || job.location || job.contact_name);
      setShowMore(hasExtra);

      const loadImages = async () => {
        const loaded: LoadedScreenshot[] = [];
        for (const sid of job.screenshots || []) {
          try {
            const data = await getScreenshot(sid);
            if (data) loaded.push({ id: sid, data, isNew: false });
          } catch (e) {
            console.error('Failed to load screenshot', sid, e);
          }
        }
        setScreenshots(loaded);
      };
      loadImages();
    } else {
      setCompany('');
      setTitle('');
      setStatus(initialStatus);
      setLink('');
      setNotes('');
      setSalary('');
      setLocation('');
      setWorkplace('Remote');
      const curToday = todayStr();
      setAppliedDate(initialStatus === 'Saved' ? '' : curToday);
      setFollowupDate(initialStatus === 'Saved' ? '' : addDays(7, curToday));
      setContactName('');
      setScreenshots([]);
      setShowMore(false);
    }

    setTimeout(() => companyInputRef.current?.focus(), 40);
  }, [isOpen, job, initialStatus]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await processUploadedFile(file);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const processUploadedFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      const newId = 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setScreenshots((prev) => [...prev, { id: newId, data: compressed, isNew: true }]);
      onNotify('success', 'Screenshot attached');
    } catch {
      onNotify('error', 'Failed to process screenshot');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        await processUploadedFile(files[i]);
      }
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        await processUploadedFile(files[i]);
      }
    }
  };

  const handleLinkChange = (val: string) => {
    setLink(val);
    if (!company.trim() && val.startsWith('http')) {
      const guessed = inferCompanyFromUrl(val);
      if (guessed) setCompany(guessed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim()) {
      onNotify('error', 'Company and role are required');
      return;
    }

    setSaving(true);
    try {
      const screenshotIds: string[] = [];
      for (const item of screenshots) {
        if (item.isNew) {
          await saveScreenshot(item.id, item.data);
        }
        screenshotIds.push(item.id);
      }

      const updatedJob: Job = {
        id: job ? job.id : 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        company: company.trim(),
        title: title.trim(),
        link: link.trim() || undefined,
        location: location.trim() || undefined,
        status,
        workplace,
        type: job?.type || 'Full-time',
        applied_date: appliedDate || undefined,
        followup_date: followupDate || undefined,
        contact_name: contactName.trim() || undefined,
        salary: salary.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: job?.tags || [],
        screenshots: screenshotIds,
        created_at: job ? job.created_at : Date.now(),
      };

      onSave(updatedJob);
      setSaving(false);
      onClose();
    } catch {
      setSaving(false);
      onNotify('error', 'Failed to save application');
    }
  };

  const extraCount = [salary, location, contactName].filter((v) => v.trim().length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line-subtle)]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
            <h2 className="text-[13px] font-semibold tracking-tight text-[var(--ink)]">
              {job ? 'Edit application' : 'New application'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Primary Identity: Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                Company
              </label>
              <input
                ref={companyInputRef}
                type="text"
                required
                placeholder="Linear, Stripe, Vercel..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[13px] font-medium focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                Role
              </label>
              <input
                type="text"
                required
                placeholder="Product Engineer, Designer..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[13px] font-medium focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>
          </div>

          {/* Interactive Stage Pills */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--muted)] mb-1.5">
              Stage
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {STATUS_LIST.map((st) => {
                const active = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatus(st);
                      if (st === 'Applied' && !appliedDate) {
                        const t = todayStr();
                        setAppliedDate(t);
                        setFollowupDate(addDays(7, t));
                      }
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      active
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)] shadow-2xs'
                        : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--muted-subtle)]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[st]}`} />
                    <span className="truncate">{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Link (single clean line with smart company detection) */}
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none" />
            <input
              type="url"
              placeholder="Paste job posting URL (optional)"
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[13px] focus:outline-none focus:border-[var(--ink)] transition-colors"
            />
          </div>

          {/* Notes + Screenshot Dropzone side-by-side or stacked cleanly */}
          <div className="space-y-2.5">
            <textarea
              rows={2}
              placeholder="Quick notes, referral, or key requirements (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[13px] focus:outline-none focus:border-[var(--ink)] transition-colors resize-none leading-relaxed"
            />

            {/* Compact Screenshot Bar */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-2.5 rounded-lg border border-dashed flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[var(--ink)] bg-[var(--surface-hover)]'
                  : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--muted-subtle)]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                <span>
                  Drop posting screenshot or press{' '}
                  <kbd className="px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[10px] font-mono text-[var(--ink)]">
                    ⌘V
                  </kbd>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-secondary)] hover:underline">
                Browse
              </span>
            </div>

            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {screenshots.map((s, idx) => (
                  <div
                    key={s.id}
                    className="relative group w-16 h-12 rounded-md overflow-hidden border border-[var(--line)] bg-[var(--bg)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.data}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => onViewScreenshot(s.data)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshots((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progressive Disclosure Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMore((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              {showMore ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>
                {showMore
                  ? 'Hide compensation, dates & location'
                  : 'Add compensation, dates, location & contact'}
              </span>
              {!showMore && extraCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-subtle)] text-[var(--ink)] text-[10px] font-semibold">
                  {extraCount} set
                </span>
              )}
            </button>

            {showMore && (
              <div className="mt-3 pt-3 border-t border-[var(--line-subtle)] space-y-3 animate-in fade-in duration-150">
                {/* Salary & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                      Compensation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. $160k – $190k"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[12px] focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                      Location & Workplace
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="City or timezone"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[12px] focus:outline-none focus:border-[var(--ink)]"
                      />
                      <select
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value as WorkplaceType)}
                        className="px-2 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-[11px] font-medium focus:outline-none focus:border-[var(--ink)] cursor-pointer"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-[var(--muted)]">
                        Applied date
                      </label>
                      <button
                        type="button"
                        onClick={() => setAppliedDate(todayStr())}
                        className="text-[10px] font-medium text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Today
                      </button>
                    </div>
                    <input
                      type="date"
                      value={appliedDate}
                      onChange={(e) => setAppliedDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-[12px] tabular-nums focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-[var(--muted)]">
                        Follow-up reminder
                      </label>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted)]">
                        <button
                          type="button"
                          onClick={() => setFollowupDate(addDays(3, appliedDate))}
                          className="hover:text-[var(--ink)] cursor-pointer"
                        >
                          +3d
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setFollowupDate(addDays(7, appliedDate))}
                          className="hover:text-[var(--ink)] cursor-pointer"
                        >
                          +1w
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setFollowupDate(addDays(14, appliedDate))}
                          className="hover:text-[var(--ink)] cursor-pointer"
                        >
                          +2w
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-[12px] tabular-nums focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                    Recruiter / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Name, email, or LinkedIn URL"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[12px] focus:outline-none focus:border-[var(--ink)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--line-subtle)] flex items-center justify-between">
            {job && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${job.company}?`)) {
                    onDelete(job.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <span className="text-[11px] text-[var(--muted-subtle)] hidden sm:inline">
                Press <kbd className="font-mono">Enter</kbd> to save
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-[12px] font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                {saving ? 'Saving...' : job ? 'Save changes' : 'Add application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
