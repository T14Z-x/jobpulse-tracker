import { NextRequest, NextResponse } from 'next/server';

export interface ClippedJobData {
  company: string;
  title: string;
  location: string;
  workplace: 'Remote' | 'Hybrid' | 'On-site';
  salary: string;
  notes: string;
}

function cleanText(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCompanyFromDomain(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
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
    const core = host.split('.')[0];
    if (
      core &&
      !['linkedin', 'bdjobs', 'jobs', 'careers', 'boards', 'indeed', 'glassdoor'].includes(
        core.toLowerCase()
      )
    ) {
      return core.charAt(0).toUpperCase() + core.slice(1);
    }
  } catch {
    // ignore
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    let company = inferCompanyFromDomain(url);
    let title = '';
    let location = '';
    let salary = '';
    let notes = '';

    // Step 1: Try direct HTML fetch for JSON-LD JobPosting & OpenGraph metadata
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5500);
      const htmlRes = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (htmlRes.ok) {
        const html = await htmlRes.text();

        // Check JSON-LD JobPosting schema (used by LinkedIn, Greenhouse, Lever, BDJobs, etc.)
        const ldMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        if (ldMatches) {
          for (const block of ldMatches) {
            try {
              const jsonText = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
              const parsed = JSON.parse(jsonText);
              const items = Array.isArray(parsed) ? parsed : [parsed];
              for (const item of items) {
                if (item['@type'] === 'JobPosting') {
                  if (item.title && !title) title = cleanText(String(item.title));
                  if (item.hiringOrganization?.name && !company) {
                    company = cleanText(String(item.hiringOrganization.name));
                  }
                  const addr = item.jobLocation?.address;
                  if (addr && !location) {
                    location = cleanText(
                      [addr.addressLocality, addr.addressCountry].filter(Boolean).join(', ')
                    );
                  }
                  if (item.baseSalary?.value && !salary) {
                    const v = item.baseSalary.value;
                    const currency = item.baseSalary.currency || '';
                    if (v.minValue && v.maxValue) {
                      salary = `${currency} ${v.minValue} - ${v.maxValue}`.trim();
                    } else if (v.value) {
                      salary = `${currency} ${v.value}`.trim();
                    }
                  }
                  if (item.description && !notes) {
                    notes = cleanText(String(item.description)).slice(0, 280);
                  }
                }
              }
            } catch {
              // ignore malformed JSON-LD
            }
          }
        }

        // Fallback to OpenGraph / <title> tags
        if (!title) {
          const ogTitle =
            html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
          if (ogTitle) {
            const cleaned = cleanText(ogTitle);
            // Parse "Company hiring Role in Location | LinkedIn"
            const liPattern = cleaned.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+?)(?:\s*\||\s*$)/i);
            if (liPattern) {
              if (!company) company = liPattern[1].trim();
              title = liPattern[2].trim();
              if (!location) location = liPattern[3].trim();
            } else {
              const parts = cleaned.split(/\s+[-|—@]\s+/);
              title = parts[0]?.trim() || cleaned;
              if (!company && parts[1] && !/linkedin|bdjobs|careers/i.test(parts[1])) {
                company = parts[1].trim();
              }
            }
          }
        }

        if (!notes) {
          const ogDesc =
            html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
          if (ogDesc) {
            notes = cleanText(ogDesc).slice(0, 280);
          }
        }
      }
    } catch {
      // Direct fetch blocked or timed out; proceed to Jina Reader fallback
    }

    // Step 2: Free Jina Reader API fallback (r.jina.ai) if title or company is still missing
    if (!title || !company) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (jinaRes.ok) {
          const data = await jinaRes.json();
          const jTitle = String(data?.data?.title || '');
          const jContent = String(data?.data?.content || '');

          if (jTitle && !title) {
            const parts = jTitle.split(/\s+[-|—@]\s+/);
            title = parts[0]?.trim() || jTitle;
            if (!company && parts[1]) company = parts[1].trim();
          }
          if (jContent && !notes) {
            notes = cleanText(jContent).slice(0, 280);
          }
        }
      } catch {
        // ignore fallback error
      }
    }

    const combinedText = `${title} ${location} ${notes}`;
    const workplace: ClippedJobData['workplace'] = /remote/i.test(combinedText)
      ? 'Remote'
      : /hybrid/i.test(combinedText)
      ? 'Hybrid'
      : 'On-site';

    return NextResponse.json({
      company: company || '',
      title: title || '',
      location: location || '',
      workplace,
      salary: salary || '',
      notes: notes || '',
    } satisfies ClippedJobData);
  } catch {
    return NextResponse.json({ error: 'Could not extract job details from URL' }, { status: 500 });
  }
}
