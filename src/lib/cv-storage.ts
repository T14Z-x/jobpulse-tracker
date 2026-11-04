/**
 * CV Vault & Candidate Profile Storage (IndexedDB for PDF files + LocalStorage for metadata & profile)
 */

export interface StoredResume {
  id: string;
  label: string;        // e.g. "Corporate / MTO CV" or "Full-Stack CV"
  fileName: string;
  fileSize: number;
  isDefault: boolean;
  createdAt: number;
}

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  expectedSalary: string;
  noticePeriod: string;
  coverNoteTemplate: string;
}

const RESUME_META_KEY = 'pipeline.resumes.v1';
const PROFILE_KEY = 'pipeline.profile.v1';
const CV_DB_NAME = 'jt-cv-vault-db';
const CV_STORE_NAME = 'pdf_files';

const DEFAULT_COVER_TEMPLATE = `Dear Hiring Team at {company},

I am writing to express my strong interest in the {role} position. Please find my CV attached for your review. I would welcome the opportunity to discuss how my background and experience align with your team's goals.

Best regards,
{name}`;

let cvDbPromise: Promise<IDBDatabase> | null = null;

function getCvDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable in SSR'));
  }
  if (!cvDbPromise) {
    cvDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(CV_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(CV_STORE_NAME)) {
          db.createObjectStore(CV_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return cvDbPromise;
}

export function getStoredResumes(): StoredResume[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RESUME_META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveResumeMetadata(list: StoredResume[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RESUME_META_KEY, JSON.stringify(list));
}

export async function uploadResumePdf(file: File, label: string): Promise<StoredResume> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const id = 'cv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const db = await getCvDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CV_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CV_STORE_NAME);
    const req = store.put(dataUrl, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const existing = getStoredResumes();
  const newResume: StoredResume = {
    id,
    label: label.trim() || file.name.replace(/\.pdf$/i, ''),
    fileName: file.name,
    fileSize: file.size,
    isDefault: existing.length === 0,
    createdAt: Date.now(),
  };

  saveResumeMetadata([newResume, ...existing]);
  return newResume;
}

export async function getResumePdfData(id: string): Promise<string | null> {
  const db = await getCvDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CV_STORE_NAME, 'readonly');
    const store = tx.objectStore(CV_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteResume(id: string): Promise<StoredResume[]> {
  try {
    const db = await getCvDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CV_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CV_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore IDB error
  }

  let next = getStoredResumes().filter((r) => r.id !== id);
  if (next.length > 0 && !next.some((r) => r.isDefault)) {
    next = next.map((r, i) => (i === 0 ? { ...r, isDefault: true } : r));
  }
  saveResumeMetadata(next);
  return next;
}

export function setDefaultResume(id: string): StoredResume[] {
  const next = getStoredResumes().map((r) => ({
    ...r,
    isDefault: r.id === id,
  }));
  saveResumeMetadata(next);
  return next;
}

export function getCandidateProfile(): CandidateProfile {
  if (typeof window === 'undefined') {
    return {
      fullName: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: '',
      expectedSalary: '',
      noticePeriod: '',
      coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
    };
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return {
        fullName: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        portfolioUrl: '',
        expectedSalary: '',
        noticePeriod: '',
        coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
      };
    }
    return {
      fullName: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: '',
      expectedSalary: '',
      noticePeriod: '',
      coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
      ...JSON.parse(raw),
    };
  } catch {
    return {
      fullName: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: '',
      expectedSalary: '',
      noticePeriod: '',
      coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
    };
  }
}

export function saveCandidateProfile(profile: CandidateProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function generateTailoredCoverNote(company: string, role: string): string {
  const profile = getCandidateProfile();
  const tpl = profile.coverNoteTemplate || DEFAULT_COVER_TEMPLATE;
  return tpl
    .replace(/\{company\}/gi, company || 'your company')
    .replace(/\{role\}/gi, role || 'this role')
    .replace(/\{name\}/gi, profile.fullName || '[Your Name]')
    .replace(/\{email\}/gi, profile.email || '')
    .replace(/\{phone\}/gi, profile.phone || '')
    .replace(/\{linkedin\}/gi, profile.linkedinUrl || '')
    .replace(/\{portfolio\}/gi, profile.portfolioUrl || '');
}
