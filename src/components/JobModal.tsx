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
  Copy,
  RefreshCw,
} from 'lucide-react';
import { generateTailoredCoverNote } from '@/lib/cv-storage';

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
  const [clipping, setClipping] = useState(false);

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

    if (window.innerWidth >= 640) {
      setTimeout(() => companyInputRef.current?.focus(), 40);
    }
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

  const handleAutoFillFromUrl = async () => {
    if (!link.trim().startsWith('http')) {
      onNotify('error', 'Paste a valid job URL first');
      return;
    }
    setClipping(true);
    try {
      const res = await fetch('/api/clip-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link.trim() }),
      });
      if (!res.ok) throw new Error('Clip failed');
      const data = await res.json();
      if (data.company && !company.trim()) setCompany(data.company);
      if (data.title && !title.trim()) setTitle(data.title);
      if (data.location && !location.trim()) setLocation(data.location);
      if (data.workplace) setWorkplace(data.workplace);
      if (data.salary && !salary.trim()) setSalary(data.salary);
      if (data.notes && !notes.trim()) setNotes(data.notes);
      onNotify('success', 'Auto-filled details from job URL');
    } catch {
      onNotify('error', 'Could not scrape details from that URL');
    } finally {
      setClipping(false);
    }
  };

  const handleCopyCoverNote = () => {
    const text = generateTailoredCoverNote(company, title);
    navigator.clipboard.writeText(text);
    onNotify('success', 'Tailored cover note copied');
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] rounded-t-2xl sm:rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden max-h-[92dvh] overflow-y-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] flex items-center justify-between px-5 py-4 border-b border-[var(--line-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
            <h2 className="text-[15px] sm:text-[16px] font-semibold tracking-tight text-[var(--ink)]">
              {job ? 'Edit application' : 'New application'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Primary Identity: Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                Company
              </label>
              <input
                ref={companyInputRef}
                type="text"
                required
                placeholder="Linear, BRAC Bank, Pathao..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[14px] font-medium focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
                Role
              </label>
              <input
                type="text"
                required
                placeholder="Marketing Executive, Engineer..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[14px] font-medium focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>
          </div>

          {/* Interactive Stage Pills */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--muted)] mb-1.5">
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
                    className={`px-2.5 py-2 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      active
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)] shadow-2xs'
                        : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--muted-subtle)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[st]}`} />
                    <span className="truncate">{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Link */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
              <input
                type="url"
                placeholder="Paste LinkedIn / BDJobs / Career URL to auto-fill..."
                value={link}
                onChange={(e) => handleLinkChange(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 sm:py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[14px] focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>
            {link.trim().startsWith('http') && (
              <button
                type="button"
                disabled={clipping}
                onClick={handleAutoFillFromUrl}
                className="px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[13px] font-semibold text-[var(--ink)] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Scrape company, role, location & description from URL"
              >
                {clipping ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{clipping ? 'Reading...' : 'Auto-fill'}</span>
              </button>
            )}
          </div>

          {/* Notes + Screenshot Dropzone */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--muted)]">Notes</span>
              {(company.trim() || title.trim()) && (
                <button
                  type="button"
                  onClick={handleCopyCoverNote}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy tailored cover note</span>
                </button>
              )}
            </div>
            <textarea
              rows={2}
              placeholder="Quick notes, referral, or key requirements (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[14px] focus:outline-none focus:border-[var(--ink)] transition-colors resize-none leading-relaxed"
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
              className={`px-3.5 py-3 rounded-xl border border-dashed flex items-center justify-between gap-2 cursor-pointer transition-colors ${
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
              <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
                <ImageIcon className="w-4 h-4 text-[var(--muted)] shrink-0" />
                <span>
                  Attach job screenshot{' '}
                  <span className="hidden sm:inline">
                    or press{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[11px] font-mono text-[var(--ink)]">
                      ⌘V
                    </kbd>
                  </span>
                </span>
              </div>
              <span className="text-[13px] font-semibold text-[var(--ink-secondary)] hover:underline">
                Browse
              </span>
            </div>

            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {screenshots.map((s, idx) => (
                  <div
                    key={s.id}
                    className="relative group w-18 h-14 rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--bg)]"
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
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center text-[11px] cursor-pointer"
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
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              {showMore ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>
                {showMore
                  ? 'Hide compensation, dates & location'
                  : 'Add compensation, dates, location & contact'}
              </span>
              {!showMore && extraCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink)] text-[11.5px] font-semibold">
                  {extraCount} set
                </span>
              )}
            </button>

            {showMore && (
              <div className="mt-3.5 pt-3.5 border-t border-[var(--line-subtle)] space-y-3.5 animate-in fade-in duration-150">
                {/* Salary & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--muted)] mb-1">
                      Compensation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BDT 65,000 / $120k"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[13.5px] focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--muted)] mb-1">
                      Location & Workplace
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Dhaka, Remote..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[13.5px] focus:outline-none focus:border-[var(--ink)]"
                      />
                      <select
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value as WorkplaceType)}
                        className="px-2.5 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-[13px] font-medium focus:outline-none focus:border-[var(--ink)] cursor-pointer"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[13px] font-medium text-[var(--muted)]">
                        Applied date
                      </label>
                      <button
                        type="button"
                        onClick={() => setAppliedDate(todayStr())}
                        className="text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Today
                      </button>
                    </div>
                    <input
                      type="date"
                      value={appliedDate}
                      onChange={(e) => setAppliedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-[15px] sm:text-[13.5px] tabular-nums focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[13px] font-medium text-[var(--muted)]">
                        Follow-up reminder
                      </label>
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
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
                      className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-[15px] sm:text-[13.5px] tabular-nums focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-[13px] font-medium text-[var(--muted)] mb-1">
                    Recruiter / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Name, email, or LinkedIn URL"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted-subtle)] text-[16px] sm:text-[13.5px] focus:outline-none focus:border-[var(--ink)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3.5 border-t border-[var(--line-subtle)] flex items-center justify-between gap-2">
            {job && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${job.company}?`)) {
                    onDelete(job.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13.5px] font-medium text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <span className="text-[12.5px] text-[var(--muted-subtle)] hidden sm:inline">
                Press <kbd className="font-mono">Enter</kbd> to save
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-[13.5px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4.5 py-2 text-[13.5px] font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
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
