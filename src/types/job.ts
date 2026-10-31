export type JobStatus = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';

export type WorkplaceType = 'Remote' | 'Hybrid' | 'On-site';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface Screenshot {
  id: string;
  data: string; // base64 data URL or remote Supabase storage URL
  name?: string;
  created_at?: number;
}

export interface Job {
  id: string;
  company: string;
  title: string;
  link?: string;
  location?: string;
  status: JobStatus;
  workplace?: WorkplaceType;
  type?: JobType;
  applied_date?: string; // YYYY-MM-DD
  followup_date?: string; // YYYY-MM-DD
  contact_name?: string;
  contact_email?: string;
  salary?: string;
  resume_version?: string;
  notes?: string;
  tags?: string[];
  screenshots?: string[]; // IDs or URLs
  created_at: number;
  updated_at?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  jobs: Job[];
  images?: Record<string, string>; // id -> base64
}
