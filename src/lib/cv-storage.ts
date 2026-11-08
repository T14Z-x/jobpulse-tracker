/**
 * CV Vault & Candidate Profile Storage (IndexedDB + LocalStorage + Supabase Cloud Sync)
 */

import { getSupabaseClient } from './supabase';

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

I am writing to express my strong interest in the {role} position. Please find my CV attached for your review, and you can also view my portfolio at {portfolio}. I would welcome the opportunity to discuss how my background and experience align with your team's goals.

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

async function putPdfInIdb(id: string, dataUrl: string): Promise<void> {
  const db = await getCvDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CV_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CV_STORE_NAME);
    const req = store.put(dataUrl, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
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
  await putPdfInIdb(id, dataUrl);

  const existing = getStoredResumes();
  const newResume: StoredResume = {
    id,
    label: label.trim() || file.name.replace(/\.pdf$/i, ''),
    fileName: file.name,
    fileSize: file.size,
    isDefault: existing.length === 0,
    createdAt: Date.now(),
  };

  const nextList = [newResume, ...existing];
  saveResumeMetadata(nextList);

  // Sync to Supabase if signed in
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (userId) {
        await supabase.from('resumes').upsert({
          id: newResume.id,
          user_id: userId,
          label: newResume.label,
          file_name: newResume.fileName,
          file_size: newResume.fileSize,
          file_data: dataUrl,
          is_default: newResume.isDefault,
          created_at: newResume.createdAt,
        });
      }
    } catch {
      // ignore cloud sync error
    }
  }

  return newResume;
}

export async function getResumePdfData(id: string): Promise<string | null> {
  try {
    const db = await getCvDb();
    const localData = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(CV_STORE_NAME, 'readonly');
      const store = tx.objectStore(CV_STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (localData) return localData;
  } catch {
    // fallback to Supabase
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.from('resumes').select('file_data').eq('id', id).single();
      if (data?.file_data) {
        await putPdfInIdb(id, data.file_data);
        return data.file_data;
      }
    } catch {
      // ignore
    }
  }

  return null;
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

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('resumes').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  return next;
}

export function setDefaultResume(id: string): StoredResume[] {
  const next = getStoredResumes().map((r) => ({
    ...r,
    isDefault: r.id === id,
  }));
  saveResumeMetadata(next);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        for (const r of next) {
          supabase
            .from('resumes')
            .update({ is_default: r.isDefault })
            .eq('id', r.id)
            .eq('user_id', data.user.id)
            .then(() => {});
        }
      }
    });
  }

  return next;
}

export function getCandidateProfile(): CandidateProfile {
  if (typeof window === 'undefined') {
    return {
      fullName: 'Gazi Asif Imtiaz',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: 'https://t14z.vercel.app',
      expectedSalary: '',
      noticePeriod: '',
      coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
    };
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return {
        fullName: 'Gazi Asif Imtiaz',
        email: '',
        phone: '',
        linkedinUrl: '',
        portfolioUrl: 'https://t14z.vercel.app',
        expectedSalary: '',
        noticePeriod: '',
        coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
      };
    }
    return {
      fullName: 'Gazi Asif Imtiaz',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: 'https://t14z.vercel.app',
      expectedSalary: '',
      noticePeriod: '',
      coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
      ...JSON.parse(raw),
    };
  } catch {
    return {
      fullName: 'Gazi Asif Imtiaz',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: 'https://t14z.vercel.app',
      expectedSalary: '',
      noticePeriod: '',
      coverNoteTemplate: DEFAULT_COVER_TEMPLATE,
    };
  }
}

export function saveCandidateProfile(profile: CandidateProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      if (userId) {
        supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            linkedin_url: profile.linkedinUrl,
            portfolio_url: profile.portfolioUrl,
            expected_salary: profile.expectedSalary,
            notice_period: profile.noticePeriod,
            cover_note_template: profile.coverNoteTemplate,
            updated_at: new Date().toISOString(),
          })
          .then(() => {});
      }
    });
  }
}

/**
 * Pulls the authenticated user's Profile & CV Vault from Supabase Cloud into local cache
 */
export async function syncVaultFromCloud(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return;

    // 1. Fetch profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (prof) {
      const merged: CandidateProfile = {
        fullName: prof.full_name || '',
        email: prof.email || '',
        phone: prof.phone || '',
        linkedinUrl: prof.linkedin_url || '',
        portfolioUrl: prof.portfolio_url || '',
        expectedSalary: prof.expected_salary || '',
        noticePeriod: prof.notice_period || '',
        coverNoteTemplate: prof.cover_note_template || DEFAULT_COVER_TEMPLATE,
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    } else {
      // Push local profile up to cloud for new user
      const localProf = getCandidateProfile();
      if (authData?.user?.email && !localProf.email) {
        localProf.email = authData.user.email;
      }
      saveCandidateProfile(localProf);
    }

    // 2. Fetch resumes metadata
    const { data: cloudResumes } = await supabase
      .from('resumes')
      .select('id, label, file_name, file_size, is_default, created_at, file_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cloudResumes && cloudResumes.length > 0) {
      const metaList: StoredResume[] = [];
      for (const row of cloudResumes) {
        metaList.push({
          id: row.id,
          label: row.label,
          fileName: row.file_name,
          fileSize: row.file_size,
          isDefault: row.is_default,
          createdAt: Number(row.created_at) || Date.now(),
        });
        if (row.file_data) {
          await putPdfInIdb(row.id, row.file_data);
        }
      }
      saveResumeMetadata(metaList);
    }
  } catch {
    // ignore if tables aren't created yet
  }
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

export function generateFollowUpMessage(company: string, role: string, appliedDate?: string): string {
  const profile = getCandidateProfile();
  const datePart = appliedDate ? ` on ${appliedDate}` : ' recently';
  return `Hi ${company} Hiring Team,

I hope your week is going well. I applied for the ${role} position${datePart} and wanted to briefly follow up to reiterate my enthusiasm for the role.

Please let me know if there is any additional information or work samples I can share${
    profile.portfolioUrl ? ` (my portfolio is at ${profile.portfolioUrl})` : ''
  }.

Best regards,
${profile.fullName || '[Your Name]'}`;
}
