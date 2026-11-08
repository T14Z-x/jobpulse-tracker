'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  StoredResume,
  CandidateProfile,
  getStoredResumes,
  uploadResumePdf,
  getResumePdfData,
  deleteResume,
  setDefaultResume,
  getCandidateProfile,
  saveCandidateProfile,
} from '@/lib/cv-storage';
import {
  X,
  FileText,
  Upload,
  Star,
  Download,
  Eye,
  Trash2,
  Copy,
  Check,
  User,
} from 'lucide-react';

interface CvVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const CvVaultModal: React.FC<CvVaultModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'resumes' | 'profile'>('resumes');
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState<CandidateProfile>(() => getCandidateProfile());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResumes(getStoredResumes());
      setProfile(getCandidateProfile());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadResumePdf(file, labelInput || file.name.replace(/\.pdf$/i, ''));
      setResumes(getStoredResumes());
      setLabelInput('');
      onNotify('success', 'CV saved to vault');
    } catch {
      onNotify('error', 'Could not store CV file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePreviewResume = async (r: StoredResume) => {
    const dataUrl = await getResumePdfData(r.id);
    if (!dataUrl) {
      onNotify('error', 'CV file data not found');
      return;
    }
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${dataUrl}" style="border:0;width:100vw;height:100vh;" title="${r.label}"></iframe>`
      );
    }
  };

  const handleDownloadResume = async (r: StoredResume) => {
    const dataUrl = await getResumePdfData(r.id);
    if (!dataUrl) {
      onNotify('error', 'CV file data not found');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = r.fileName || `${r.label}.pdf`;
    a.click();
  };

  const handleSetDefault = (id: string) => {
    setResumes(setDefaultResume(id));
    onNotify('success', 'Default CV updated');
  };

  const handleDeleteResume = async (id: string) => {
    const next = await deleteResume(id);
    setResumes(next);
    onNotify('info', 'CV removed from vault');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCandidateProfile(profile);
    onNotify('success', 'Candidate profile saved');
  };

  const copyValue = (key: string, val: string) => {
    if (!val.trim()) return;
    navigator.clipboard.writeText(val);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1600);
    onNotify('success', 'Copied to clipboard');
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[var(--surface)] text-[var(--ink)] rounded-t-2xl sm:rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden max-h-[92dvh] overflow-y-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-5 py-4 border-b border-[var(--line-subtle)] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] sm:text-[16px] font-semibold tracking-tight text-[var(--ink)]">
              CV Vault & Candidate Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 sm:flex items-center p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line-subtle)] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTab('resumes')}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'resumes'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My CVs ({resumes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'profile'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Quick-Copy Profile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {tab === 'resumes' ? (
          <div className="p-5 space-y-4">
            {/* Upload Bar */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                placeholder="CV Label (e.g. Corporate / MTO CV, Tech CV)"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[16px] sm:text-[13.5px] text-[var(--ink)] placeholder-[var(--muted-subtle)] focus:outline-none focus:border-[var(--ink)]"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,application/pdf"
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 sm:py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload PDF CV'}</span>
              </button>
            </div>

            {/* Stored CVs List */}
            {resumes.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-[var(--line)]">
                <FileText className="w-7 h-7 text-[var(--muted-subtle)] mx-auto mb-2" />
                <p className="text-[14.5px] font-semibold text-[var(--ink)]">No CVs stored yet</p>
                <p className="text-[13.5px] text-[var(--muted)] mt-1">
                  Upload your PDF resumes here so they are always 1 click away when applying on BDJobs or LinkedIn.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line-subtle)] flex items-center justify-center text-[var(--ink-secondary)] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14.5px] font-semibold text-[var(--ink)] truncate">
                            {r.label}
                          </h4>
                          {r.isDefault && (
                            <span className="px-2 py-0.5 rounded-md text-[11.5px] font-semibold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-[var(--muted)] truncate">
                          {r.fileName} · {fmtSize(r.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!r.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(r.id)}
                          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          title="Set as Default CV"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePreviewResume(r)}
                        className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        title="Preview PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadResume(r)}
                        className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResume(r.id)}
                        className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
            <p className="text-[13.5px] text-[var(--muted)]">
              Save your links and cover note template once. Tap the copy icon next to any field when filling out application forms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { key: 'fullName', label: 'Full Name', placeholder: 'Your Name' },
                { key: 'email', label: 'Email', placeholder: 'you@example.com' },
                { key: 'phone', label: 'Phone (BD / WhatsApp)', placeholder: '+880 17...' },
                { key: 'expectedSalary', label: 'Expected Salary', placeholder: 'e.g. BDT 60,000 / $2,000' },
                { key: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
                { key: 'portfolioUrl', label: 'Portfolio / GitHub URL', placeholder: 'https://...' },
              ].map((field) => {
                const val = profile[field.key as keyof CandidateProfile];
                return (
                  <div key={field.key}>
                    <label className="block text-[13px] font-medium text-[var(--muted)] mb-1">
                      {field.label}
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={val}
                        onChange={(e) =>
                          setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[16px] sm:text-[13.5px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
                      />
                      <button
                        type="button"
                        onClick={() => copyValue(field.key, val)}
                        className="px-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        title={`Copy ${field.label}`}
                      >
                        {copiedField === field.key ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[13px] font-medium text-[var(--muted)]">
                  Cover Note Template (uses {'{company}'}, {'{role}'}, {'{name}'})
                </label>
                <button
                  type="button"
                  onClick={() => copyValue('cover', profile.coverNoteTemplate)}
                  className="text-[12.5px] font-semibold text-[var(--ink-secondary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'cover' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy template</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={profile.coverNoteTemplate}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, coverNoteTemplate: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[16px] sm:text-[13.5px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] leading-relaxed resize-none"
              />
            </div>

            <div className="pt-3 border-t border-[var(--line-subtle)] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-[13.5px] font-medium text-[var(--muted)] hover:text-[var(--ink)] rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 text-[13.5px] font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] rounded-xl cursor-pointer"
              >
                Save profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
