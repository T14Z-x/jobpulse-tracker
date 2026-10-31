'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus, WorkplaceType, JobType } from '@/types/job';
import { STATUS_LIST } from './FilterBar';
import { saveScreenshot, getScreenshot, deleteScreenshot, compressImage } from '@/lib/idb';
import { X, Upload, Trash2, Calendar, Link as LinkIcon, DollarSign, MapPin, User, Mail, Tag, FileText, Image as ImageIcon } from 'lucide-react';

interface JobModalProps {
  isOpen: boolean;
  job: Job | null; // null for new job
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

      // Load existing screenshots from IndexedDB
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
      // New Job defaults
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

  // Handle Clipboard Paste
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
      onNotify('success', 'Screenshot added!');
    } catch {
      onNotify('error', 'Failed to process screenshot.');
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
      onNotify('error', 'Company name and Job title are required.');
      return;
    }

    setSaving(true);

    try {
      // Save new screenshots to IndexedDB
      const screenshotIds: string[] = [];
      for (const item of screenshots) {
        if (item.isNew) {
          await saveScreenshot(item.id, item.data);
        }
        screenshotIds.push(item.id);
      }

      // Parse tags
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
      onNotify('error', 'Failed to save job application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {job ? 'Edit Application' : 'Add New Job'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keep full track of the role, requirements, follow-ups, and screenshots
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Row 1: Company & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe, Figma, Apple"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: Status, Workplace, Job Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Pipeline Status
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Workplace
              </label>
              <select
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value as WorkplaceType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Job Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Row 3: Link & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5" /> Job Posting URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA / London / Worldwide"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 4: Applied Date & Follow-up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date Applied
                </label>
                <button
                  type="button"
                  onClick={() => setAppliedDate(todayStr())}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Set Today
                </button>
              </div>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Follow-up Date
                </label>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <button type="button" onClick={() => setFollowupDate(addDays(3, appliedDate))} className="hover:underline">+3d</button>
                  <span>•</span>
                  <button type="button" onClick={() => setFollowupDate(addDays(7, appliedDate))} className="hover:underline">+1w</button>
                  <span>•</span>
                  <button type="button" onClick={() => setFollowupDate(addDays(14, appliedDate))} className="hover:underline">+2w</button>
                </div>
              </div>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 5: Salary & Resume Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Salary Range
              </label>
              <input
                type="text"
                placeholder="e.g. $160,000 - $190,000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Resume Version Used
              </label>
              <input
                type="text"
                placeholder="e.g. Resume_Frontend_v3.pdf"
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 6: Recruiter / Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Contact / Recruiter Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Contact Email
              </label>
              <input
                type="email"
                placeholder="e.g. recruiter@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Tags & Tech Stack (comma separated)
            </label>
            <input
              type="text"
              placeholder="React, TypeScript, Next.js, GraphQL, FinTech"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Notes & Interview Progress
            </label>
            <textarea
              rows={3}
              placeholder="Notes on company culture, interview rounds, questions asked, referrals..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Screenshot Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Posting Screenshots & Offers
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-slate-400'
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
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Click to browse files, drag images here, or paste with <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Ctrl+V</kbd>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Images are compressed automatically and stored safely.</p>
            </div>

            {/* Thumbnail preview row */}
            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mt-3">
                {screenshots.map((s, idx) => (
                  <div key={s.id} className="relative group w-20 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.data}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => onViewScreenshot(s.data)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveScreenshot(idx);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 text-white rounded-full transition-opacity opacity-80 hover:opacity-100"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {job && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete application for ${job.company}?`)) {
                    onDelete(job.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Job
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : job ? 'Update Job' : 'Add Job'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
