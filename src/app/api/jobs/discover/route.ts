import { NextRequest, NextResponse } from 'next/server';

export interface DiscoveredJob {
  id: string;
  source: 'LinkedIn BD' | 'BDJobs' | 'Remotive' | 'Arbeitnow';
  market: 'bangladesh' | 'remote';
  company: string;
  companyLogo?: string;
  title: string;
  location: string;
  workplace: 'Remote' | 'Hybrid' | 'On-site';
  salary?: string;
  url: string;
  postedAt: string;
  tags: string[];
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1. LinkedIn Guest Search Parser for Bangladesh Market (All Industries)
 */
async function fetchLinkedInBangladesh(query: string): Promise<DiscoveredJob[]> {
  const q = query.trim();
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
    q
  )}&location=${encodeURIComponent('Bangladesh')}&start=0`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const html = await res.text();

    const blocks = html.split('<li').slice(1);
    const results: DiscoveredJob[] = [];

    for (const block of blocks) {
      const titleMatch = block.match(/class="base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const companyMatch =
        block.match(/class="base-search-card__subtitle[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/class="base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const locMatch = block.match(/class="job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const linkMatch = block.match(/href="(https:\/\/[a-z.]*linkedin\.com\/jobs\/view\/[^"?]+)/i);
      const dateMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
      const logoMatch = block.match(/data-delayed-url="([^"]+)"/i);
      const urnMatch = block.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/i);

      if (!titleMatch || !companyMatch || !linkMatch) continue;

      const title = decodeHtml(titleMatch[1].replace(/<[^>]+>/g, ''));
      const company = decodeHtml(companyMatch[1].replace(/<[^>]+>/g, ''));
      const location = locMatch ? decodeHtml(locMatch[1].replace(/<[^>]+>/g, '')) : 'Dhaka, Bangladesh';
      const cleanUrl = linkMatch[1].split('?')[0];
      const postedAt = dateMatch ? decodeHtml(dateMatch[2].replace(/<[^>]+>/g, '')) || dateMatch[1] : 'Recently';
      const logo = logoMatch ? decodeHtml(logoMatch[1]) : undefined;
      const id = urnMatch ? `li_${urnMatch[1]}` : `li_${Buffer.from(cleanUrl).toString('base64').slice(0, 12)}`;

      const isRemote = /remote/i.test(title) || /remote/i.test(location);
      const isHybrid = /hybrid/i.test(title) || /hybrid/i.test(location);

      results.push({
        id,
        source: 'LinkedIn BD',
        market: 'bangladesh',
        company,
        companyLogo: logo,
        title,
        location,
        workplace: isRemote ? 'Remote' : isHybrid ? 'Hybrid' : 'On-site',
        url: cleanUrl,
        postedAt,
        tags: ['Bangladesh', 'LinkedIn'],
      });
    }

    return results.slice(0, 24);
  } catch {
    return [];
  }
}

/**
 * 2. BDJobs Live Search Parser for Bangladesh Market (All Industries)
 */
async function fetchBDJobs(query: string): Promise<DiscoveredJob[]> {
  const q = query.trim() || 'Executive';
  const searchUrl = `https://jobs.bdjobs.com/jobsearch.asp?txtsearch=${encodeURIComponent(q)}`;

  try {
    const res = await fetchWithTimeout(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const html = await res.text();
    const results: DiscoveredJob[] = [];

    const linkRegex = /<a[^>]+href="([^"]*jobdetails\.asp\?id=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null && results.length < 18) {
      const rawHref = match[1];
      const jobId = match[2];
      const rawTitle = decodeHtml(match[3].replace(/<[^>]+>/g, ''));
      if (!rawTitle || rawTitle.length < 3) continue;

      const snippet = html.slice(Math.max(0, match.index - 600), Math.min(html.length, match.index + 1200));
      const compMatch =
        snippet.match(/class="comp-name-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
        snippet.match(/class="org-name[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
      const locMatch = snippet.match(/class="locon-text-d[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const deadMatch = snippet.match(/Deadline:[\s\S]*?<strong>([\s\S]*?)<\/strong>/i);

      const company = compMatch ? decodeHtml(compMatch[1].replace(/<[^>]+>/g, '')) : 'BDJobs Employer';
      const location = locMatch ? decodeHtml(locMatch[1].replace(/<[^>]+>/g, '')) : 'Dhaka, Bangladesh';
      const deadline = deadMatch ? `Due ${decodeHtml(deadMatch[1].replace(/<[^>]+>/g, ''))}` : 'Active on BDJobs';

      const fullUrl = rawHref.startsWith('http')
        ? rawHref
        : `https://jobs.bdjobs.com/${rawHref.replace(/^\//, '')}`;

      if (!results.some((r) => r.id === `bdj_${jobId}`)) {
        results.push({
          id: `bdj_${jobId}`,
          source: 'BDJobs',
          market: 'bangladesh',
          company,
          title: rawTitle,
          location,
          workplace: /remote/i.test(rawTitle) ? 'Remote' : 'On-site',
          url: fullUrl,
          postedAt: deadline,
          tags: ['Bangladesh', 'BDJobs'],
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * 3. Remotive Public API for International Remote Jobs (Marketing, Sales, Support, Finance, HR, Design, Tech)
 */
async function fetchRemotiveJobs(query: string): Promise<DiscoveredJob[]> {
  const q = query.trim();
  const url = q
    ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=24`
    : `https://remotive.com/api/remote-jobs?limit=24`;

  try {
    const res = await fetchWithTimeout(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.jobs) ? data.jobs : [];

    return list.slice(0, 24).map((item: Record<string, unknown>) => {
      const pubDate = typeof item.publication_date === 'string' ? item.publication_date.slice(0, 10) : 'Recent';
      const rawTags = Array.isArray(item.tags) ? (item.tags as string[]).slice(0, 3) : [];
      return {
        id: `rem_${item.id}`,
        source: 'Remotive',
        market: 'remote',
        company: String(item.company_name || 'Remote Company'),
        companyLogo: typeof item.company_logo === 'string' ? item.company_logo : undefined,
        title: String(item.title || 'Remote Role'),
        location: String(item.candidate_required_location || 'Worldwide'),
        workplace: 'Remote',
        salary: typeof item.salary === 'string' && item.salary.trim() ? item.salary.trim() : undefined,
        url: String(item.url || 'https://remotive.com'),
        postedAt: pubDate,
        tags: rawTags,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 4. Arbeitnow Public API for International & Remote Jobs (All Fields)
 */
async function fetchArbeitnowJobs(query: string): Promise<DiscoveredJob[]> {
  try {
    const res = await fetchWithTimeout('https://www.arbeitnow.com/api/job-board-api', {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    const ql = query.trim().toLowerCase();

    const filtered = list.filter((item: Record<string, unknown>) => {
      if (!ql) return true;
      const hay = `${item.title || ''} ${item.company_name || ''} ${(item.tags as string[] || []).join(' ')}`.toLowerCase();
      return hay.includes(ql);
    });

    return filtered.slice(0, 18).map((item: Record<string, unknown>) => {
      const isRemote = Boolean(item.remote);
      const created =
        typeof item.created_at === 'number'
          ? new Date(item.created_at * 1000).toISOString().slice(0, 10)
          : 'Recent';
      return {
        id: `arb_${item.slug || Math.random().toString(36).slice(2, 8)}`,
        source: 'Arbeitnow',
        market: 'remote',
        company: String(item.company_name || 'Global Employer'),
        title: String(item.title || 'Open Role'),
        location: isRemote ? 'Remote (Global)' : String(item.location || 'International'),
        workplace: isRemote ? 'Remote' : 'Hybrid',
        url: String(item.url || 'https://www.arbeitnow.com'),
        postedAt: created,
        tags: Array.isArray(item.tags) ? (item.tags as string[]).slice(0, 3) : ['International'],
      };
    });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const market = searchParams.get('market') || 'all';

  const tasks: Promise<DiscoveredJob[]>[] = [];

  if (market === 'all' || market === 'bangladesh') {
    tasks.push(fetchLinkedInBangladesh(query));
    tasks.push(fetchBDJobs(query));
  }
  if (market === 'all' || market === 'remote') {
    tasks.push(fetchRemotiveJobs(query));
    tasks.push(fetchArbeitnowJobs(query));
  }

  const settled = await Promise.allSettled(tasks);
  const combined: DiscoveredJob[] = [];

  for (const res of settled) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      combined.push(...res.value);
    }
  }

  return NextResponse.json({
    jobs: combined,
    total: combined.length,
    fetchedAt: new Date().toISOString(),
  });
}
