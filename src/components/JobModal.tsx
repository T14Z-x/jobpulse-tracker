'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus, WorkplaceType, JobType } from '@/types/job';
import { STATUS_LIST } from './FilterBar';
import { saveScreenshot, getScreenshot, compressImage } from '@/lib/idb';
import { X, Upload, Trash2, Calendar, Link as LinkIcon, DollarSign, MapPin, User, Mail, Tag, FileText, Image as ImageIcon } from 'lucide-react';

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

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [workplace, setWorkplace] = useState<WorkplaceType>('Remote');
  const [type, setType] = useState<JobType>('Full-time');
  const [appliedDate, setAppliedDate] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [resumeVersion, setResumeVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [screenshots, setScreenshots] = useState<LoadedScreenshot[]>([]);
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
      setLink(job.link || '');
      setLocation(job.location || '');
      setStatus(job.status || 'Applied');
      setWorkplace(job.workplace || 'Remote');
      setType(job.type || 'Full-time');
      setAppliedDate(job.applied_date || '');
      setFollowupDate(job.followup_date || '');
      setContactName(job.contact_name || '');
      setContactEmail(job.contact_email || '');
      setSalary(job.salary || '');
      setResumeVersion(job.resume_version || '');
      setNotes(job.notes || '');
      setTagInput((job.tags || []).join(', '));

      const loadImages = async () => {
        const loaded: LoadedScreenshot[] = [];
        for (const sid of job.screenshots || []) {
          try {
            const data = await getScreenshot(sid);
            if (data) {
              loaded.push({ id: sid, data, isNew: false });
            }
          } catch (e) {
            console.error('Failed to load image', sid, e);
          }
        }
        setScreenshots(loaded);
      };
      loadImages();
    } else {
      setCompany('');
      setTitle('');
      setLink('');
      setLocation('');
      setStatus(initialStatus);
      setWorkplace('Remote');
      setType('Full-time');
      const curToday = todayStr();
      setAppliedDate(initialStatus === 'Saved' ? '' : curToday);
      setFollowupDate(initialStatus === 'Saved' ? '' : addDays(7, curToday));
      setContactName('');
      setContactEmail('');
      setSalary('');
      setResumeVersion('');
      setNotes('');
      setTagInput('');
      setScreenshots([]);
    }
  }, [isOpen, job, initialStatus]);

  useEffect(() => {
    if (!isOpen) return;

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

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processUploadedFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      const newId = 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setScreenshots((prev) => [...prev, { id: newId, data: compressed, isNew: true }]);
      onNotify('success', 'Screenshot added');
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

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim()) {
      onNotify('error', 'Company name and job title are required');
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

      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updatedJob: Job = {
        id: job ? job.id : 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        company: company.trim(),
        title: title.trim(),
        link: link.trim() || undefined,
        location: location.trim() || undefined,
        status,
        workplace,
        type,
        applied_date: appliedDate || undefined,
        followup_date: followupDate || undefined,
        contact_name: contactName.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        salary: salary.trim() || undefined,
        resume_version: resumeVersion.trim() || undefined,
        notes: notes.trim() || undefined,
        tags,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[var(--surface)] text-[var(--ink)] rounded-2xl shadow-xl border border-[var(--line)] p-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line)]">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {job ? 'Edit job' : 'Add job'}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Keep company details, dates, and screenshots organized
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Row 1: Company & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Company *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Job title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Row 2: Status, Workplace, Job Type */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newSt = e.target.value as JobStatus;
                  setStatus(newSt);
                  if (newSt === 'Applied' && !appliedDate) {
                    setAppliedDate(todayStr());
                    setFollowupDate(addDays(7));
                  }
                }}
                className="w-full px-2.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Workplace
              </label>
              <select
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value as WorkplaceType)}
                className="w-full px-2.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
                className="w-full px-2.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Row 3: Link & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Job link
              </label>
              <input
                type="url"
                placeholder="https://"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Row 4: Applied Date & Follow-up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Date applied
                </label>
                <button
                  type="button"
                  onClick={() => setAppliedDate(todayStr())}
                  className="text-[11px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Set today
                </button>
              </div>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Follow-up date
                </label>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)]">
                  <button type="button" onClick={() => setFollowupDate(addDays(3, appliedDate))} className="hover:underline cursor-pointer">+3d</button>
                  <span>·</span>
                  <button type="button" onClick={() => setFollowupDate(addDays(7, appliedDate))} className="hover:underline cursor-pointer">+1w</button>
                  <span>·</span>
                  <button type="button" onClick={() => setFollowupDate(addDays(14, appliedDate))} className="hover:underline cursor-pointer">+2w</button>
                </div>
              </div>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Row 5: Salary & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Salary range
              </label>
              <input
                type="text"
                placeholder="e.g. $160k - $190k"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Contact / recruiter
              </label>
              <input
                type="text"
                placeholder="Name or email"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Notes, interview questions, feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] leading-relaxed"
            />
          </div>

          {/* Screenshot Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
              Screenshots
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-3.5 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--muted)]'
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
              <p className="text-xs font-medium text-[var(--ink)]">
                Drop screenshots here, paste with <kbd className="px-1 py-0.5 rounded border border-[var(--line)] bg-[var(--surface)] text-[10px] font-mono">Ctrl+V</kbd>, or click to choose
              </p>
            </div>

            {/* Thumbnails */}
            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {screenshots.map((s, idx) => (
                  <div key={s.id} className="relative group w-20 h-15 rounded-md overflow-hidden border border-[var(--line)] bg-[var(--bg)]">
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
                        handleRemoveScreenshot(idx);
                      }}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] cursor-pointer hover:bg-black"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
            {job && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete application for ${job.company}?`)) {
                    onDelete(job.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors cursor-pointer"
              >
                Delete job
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-ink)] rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save job'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
