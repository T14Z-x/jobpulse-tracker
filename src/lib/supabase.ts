import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'jt_supabase_url';
const SUPABASE_ANON_KEY = 'jt_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUsedConfig: { url: string; anonKey: string } | null = null;

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    '';

  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: envKey,
    };
  }

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY);
  const storedKey = localStorage.getItem(SUPABASE_ANON_KEY);

  return {
    url: storedUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: storedKey || envKey,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  if (url.trim()) {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
  }

  if (anonKey.trim()) {
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_ANON_KEY);
  }

  cachedClient = null;
  lastUsedConfig = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (
    cachedClient &&
    lastUsedConfig?.url === url &&
    lastUsedConfig?.anonKey === anonKey
  ) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedConfig = { url, anonKey };
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'URL must start with https://' };
    }
    const client = createClient(url, anonKey);
    // Attempt a light query to check connection
    const { error } = await client.from('jobs').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: The `jobs` table does not exist yet. Run the SQL schema to create it.)',
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Connection failed: ${errorMsg}` };
  }
}
