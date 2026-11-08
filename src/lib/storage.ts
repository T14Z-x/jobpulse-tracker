import { Job, ExportData } from '@/types/job';
import { getSupabaseClient } from './supabase';
import { saveScreenshot, getScreenshot, deleteScreenshot, getAllScreenshots } from './idb';

const LOCAL_STORAGE_KEY = 'jobtracker_v2_jobs';

export function getSampleJobs(): Job[] {
  const now = Date.now();
  const dayMs = 86400000;
  return [
    {
      id: 'demo-1',
      company: 'Stripe',
      title: 'Senior Frontend Engineer',
      link: 'https://stripe.com/jobs',
      location: 'San Francisco, CA (Hybrid)',
      status: 'Interview',
      workplace: 'Hybrid',
      type: 'Full-time',
      applied_date: new Date(now - 10 * dayMs).toISOString().slice(0, 10),
      followup_date: new Date(now + 2 * dayMs).toISOString().slice(0, 10),
      contact_name: 'Sarah Chen (Tech Recruiter)',
      contact_email: 'sarah.c@stripe.com',
      salary: '$185,000 - $210,000 + Equity',
      resume_version: 'Resume_Frontend_2026.pdf',
      notes: 'Technical screen went great! System design round scheduled with engineering manager next Thursday.',
      tags: ['React', 'TypeScript', 'FinTech', 'Design Systems'],
      screenshots: [],
      created_at: now - 10 * dayMs,
    },
    {
      id: 'demo-2',
      company: 'Figma',
      title: 'Product Engineer - Core Canvas',
      link: 'https://figma.com/careers',
      location: 'Remote, US',
      status: 'Offer',
      workplace: 'Remote',
      type: 'Full-time',
      applied_date: new Date(now - 25 * dayMs).toISOString().slice(0, 10),
      followup_date: new Date(now + 1 * dayMs).toISOString().slice(0, 10),
      contact_name: 'Marcus Brody',
      contact_email: 'mbrody@figma.com',
      salary: '$195,000 + RSU Grant',
      resume_version: 'Resume_Graphics_2026.pdf',
      notes: 'Received written offer! Reviewing health benefits and sign-on bonus terms. Decision needed by Friday.',
      tags: ['WebGL', 'WebAssembly', 'React', 'Product'],
      screenshots: [],
      created_at: now - 25 * dayMs,
    },
    {
      id: 'demo-3',
      company: 'Vercel',
      title: 'Developer Experience Engineer',
      link: 'https://vercel.com/careers',
      location: 'Remote, Global',
      status: 'Applied',
      workplace: 'Remote',
      type: 'Full-time',
      applied_date: new Date(now - 4 * dayMs).toISOString().slice(0, 10),
      followup_date: new Date(now - 1 * dayMs).toISOString().slice(0, 10), // Overdue follow-up
      contact_name: 'Alex Rivera',
      contact_email: 'alex@vercel.com',
      salary: '$160,000 - $185,000',
      resume_version: 'Resume_Nextjs_2026.pdf',
      notes: 'Applied via team referral. Sent follow-up email yesterday regarding application status.',
      tags: ['Next.js', 'Turbopack', 'Open Source', 'Node.js'],
      screenshots: [],
      created_at: now - 4 * dayMs,
    },
    {
      id: 'demo-4',
      company: 'Linear',
      title: 'Full Stack Product Builder',
      link: 'https://linear.app/careers',
      location: 'Remote',
      status: 'Saved',
      workplace: 'Remote',
      type: 'Full-time',
      applied_date: '',
      followup_date: new Date(now + 5 * dayMs).toISOString().slice(0, 10),
      contact_name: '',
      contact_email: '',
      salary: '$170,000 - $200,000',
      resume_version: '',
      notes: 'Need to tailor portfolio to highlight keyboard-first UX and micro-interactions.',
      tags: ['Productivity', 'Electron', 'Realtime Sync'],
      screenshots: [],
      created_at: now - 1 * dayMs,
    },
  ];
}

export function getLocalJobs(): Job[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Seed initial demo data on first visit
      const samples = getSampleJobs();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(samples));
      return samples;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local jobs:', err);
    return [];
  }
}

export function saveLocalJobs(jobs: Job[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error('Failed to write local jobs:', err);
  }
}

export async function fetchAllJobs(): Promise<{ jobs: Job[]; source: 'supabase' | 'local' }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Map database columns to Job interface
        const remoteJobs: Job[] = data.map((row) => ({
          id: row.id,
          company: row.company,
          title: row.title,
          link: row.link || '',
          location: row.location || '',
          status: row.status,
          workplace: row.workplace,
          type: row.type,
          applied_date: row.applied_date || '',
          followup_date: row.followup_date || '',
          contact_name: row.contact_name || '',
          contact_email: row.contact_email || '',
          salary: row.salary || '',
          resume_version: row.resume_version || '',
          notes: row.notes || '',
          tags: row.tags || [],
          screenshots: row.screenshots || [],
          created_at: typeof row.created_at === 'string' ? new Date(row.created_at).getTime() : row.created_at || Date.now(),
          updated_at: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
        }));

        // Mirror to local storage for fast offline cache
        saveLocalJobs(remoteJobs);
        return { jobs: remoteJobs, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }
  }

  return { jobs: getLocalJobs(), source: 'local' };
}

export async function saveJobToStorage(job: Job): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  // Always update local storage first
  const current = getLocalJobs();
  const existingIdx = current.findIndex((j) => j.id === job.id);
  let updatedList: Job[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...job, updated_at: Date.now() };
  } else {
    updatedList = [job, ...current];
  }
  saveLocalJobs(updatedList);

  // Sync to Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;

      const payload: Record<string, unknown> = {
        id: job.id,
        company: job.company,
        title: job.title,
        link: job.link || null,
        location: job.location || null,
        status: job.status,
        workplace: job.workplace || null,
        type: job.type || null,
        applied_date: job.applied_date || null,
        followup_date: job.followup_date || null,
        contact_name: job.contact_name || null,
        contact_email: job.contact_email || null,
        salary: job.salary || null,
        resume_version: job.resume_version || null,
        notes: job.notes || null,
        tags: job.tags || [],
        screenshots: job.screenshots || [],
        updated_at: new Date().toISOString(),
      };
      if (userId) {
        payload.user_id = userId;
      }

      const { error } = await supabase.from('jobs').upsert(payload);
      if (!error) {
        return { success: true, source: 'supabase' };
      }
      console.warn('Supabase upsert warning:', error.message);
    } catch (err) {
      console.error('Failed to sync job to Supabase:', err);
    }
  }

  return { success: true, source: 'local' };
}

export async function deleteJobFromStorage(id: string): Promise<boolean> {
  const current = getLocalJobs();
  const target = current.find((j) => j.id === id);

  // Remove local screenshots
  if (target?.screenshots) {
    for (const sid of target.screenshots) {
      try {
        await deleteScreenshot(sid);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Remove from local storage
  saveLocalJobs(current.filter((j) => j.id !== id));

  // Remove from Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('jobs').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete job from Supabase:', err);
    }
  }

  return true;
}

export async function syncLocalToSupabase(): Promise<{ syncedCount: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { syncedCount: 0, error: 'Supabase client is not connected.' };
  }

  const localJobs = getLocalJobs();
  if (!localJobs.length) {
    return { syncedCount: 0 };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const payload = localJobs.map((j) => {
      const row: Record<string, unknown> = {
        id: userId && !j.id.startsWith(userId.slice(0, 6)) ? `${userId.slice(0, 6)}_${j.id}` : j.id,
        company: j.company,
        title: j.title,
        link: j.link || null,
        location: j.location || null,
        status: j.status,
        workplace: j.workplace || null,
        type: j.type || null,
        applied_date: j.applied_date || null,
        followup_date: j.followup_date || null,
        contact_name: j.contact_name || null,
        contact_email: j.contact_email || null,
        salary: j.salary || null,
        resume_version: j.resume_version || null,
        notes: j.notes || null,
        tags: j.tags || [],
        screenshots: j.screenshots || [],
        created_at: new Date(j.created_at).toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (userId) {
        row.user_id = userId;
      }
      return row;
    });

    const { error } = await supabase.from('jobs').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { syncedCount: 0, error: error.message };
    }

    return { syncedCount: payload.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { syncedCount: 0, error: msg };
  }
}

export async function exportAllData(): Promise<void> {
  const jobs = getLocalJobs();
  const allImages = await getAllScreenshots();

  const exportPayload: ExportData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    jobs,
    images: allImages,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importDataFromJson(file: File): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let jobsToImport: Job[] = [];
    if (Array.isArray(data)) {
      jobsToImport = data;
    } else if (data && Array.isArray(data.jobs)) {
      jobsToImport = data.jobs;
    } else {
      return { success: false, count: 0, error: 'Invalid backup file format' };
    }

    // Save images if present in backup
    if (data.images && typeof data.images === 'object') {
      for (const [id, base64] of Object.entries(data.images)) {
        if (typeof base64 === 'string') {
          await saveScreenshot(id, base64);
        }
      }
    }

    // Merge or replace
    saveLocalJobs(jobsToImport);

    // Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      await syncLocalToSupabase();
    }

    return { success: true, count: jobsToImport.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: msg };
  }
}

export function exportToCsv(): void {
  const jobs = getLocalJobs();
  const columns: (keyof Job)[] = [
    'company',
    'title',
    'status',
    'workplace',
    'type',
    'location',
    'salary',
    'applied_date',
    'followup_date',
    'contact_name',
    'contact_email',
    'link',
    'resume_version',
    'notes',
  ];

  const escapeCsv = (val: unknown) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headerRow = columns.join(',');
  const rows = jobs.map((job) => columns.map((col) => escapeCsv(job[col])).join(','));
  const csvContent = [headerRow, ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
