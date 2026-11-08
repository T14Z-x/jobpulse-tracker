'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Job } from '@/types/job';
import type { DiscoveredJob } from '@/app/api/jobs/discover/route';
import { generateTailoredCoverNote, getStoredResumes } from '@/lib/cv-storage';
import {
  Search,
  Globe,
  MapPin,
  Bookmark,
  Check,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Building2,
  X,
  RotateCcw,
} from 'lucide-react';

interface DiscoverFeedProps {
  existingJobs: Job[];
  onSaveToPipeline: (job: Job) => void;
  onRemoveFromPipeline: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CATEGORY_PRESETS: { label: string; query: string }[] = [
  { label: 'All Jobs', query: '' },
  { label: 'Marketing & Digital', query: 'Marketing' },
  { label: 'Finance & Banking', query: 'Finance' },
  { label: 'Sales & Business Dev', query: 'Business Development' },
  { label: 'HR & Admin', query: 'Human Resources' },
  { label: 'Customer Support', query: 'Customer Support' },
  { label: 'Operations & Supply Chain', query: 'Operations' },
  { label: 'Management Trainee (MTO)', query: 'Management Trainee' },
  { label: 'NGO & Development', query: 'Project Officer' },
  { label: 'Content & Copywriting', query: 'Content Writer' },
  { label: 'Design & Creative', query: 'Designer' },
  { label: 'Software & IT', query: 'Software Engineer' },
];

type MarketFilter = 'all' | 'bangladesh' | 'remote';
type SourceFilter = 'All' | 'LinkedIn BD' | 'BDJobs' | 'Remotive' | 'Arbeitnow';

export const DiscoverFeed: React.FC<DiscoverFeedProps> = ({
  existingJobs,
  onSaveToPipeline,
  onRemoveFromPipeline,
  onNotify,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [market, setMarket] = useState<MarketFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [discovered, setDiscovered] = useState<DiscoveredJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingApplyIds, setPendingApplyIds] = useState<Record<string, DiscoveredJob>>({});

  const fetchFeed = useCallback(
    async (q: string, m: MarketFilter) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/jobs/discover?q=${encodeURIComponent(q)}&market=${encodeURIComponent(m)}`
        );
        if (!res.ok) throw new Error('Failed to load jobs');
        const data = await res.json();
        setDiscovered(Array.isArray(data.jobs) ? data.jobs : []);
      } catch {
        onNotify('error', 'Could not reach live job feeds');
      } finally {
        setLoading(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    fetchFeed(activeQuery, market);
  }, [activeQuery, market, fetchFeed]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
  };

  const handlePresetClick = (q: string) => {
    setSearchInput(q);
    setActiveQuery(q);
  };

  const findPipelineMatch = (d: DiscoveredJob): Job | undefined => {
    return existingJobs.find(
      (j) =>
        (j.link && j.link === d.url) ||
        (j.company.toLowerCase() === d.company.toLowerCase() &&
          j.title.toLowerCase() === d.title.toLowerCase())
    );
  };

  const convertToPipelineJob = (d: DiscoveredJob, status: 'Saved' | 'Applied'): Job => {
    const today = new Date().toISOString().slice(0, 10);
    const fDate = new Date();
    fDate.setDate(fDate.getDate() + 7);
    const followup = fDate.toISOString().slice(0, 10);
    const defaultCv = getStoredResumes().find((r) => r.isDefault);

    return {
      id: 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      company: d.company,
      title: d.title,
      link: d.url,
      location: d.location,
      workplace: d.workplace,
      type: 'Full-time',
      status,
      salary: d.salary,
      resume_version: defaultCv?.label,
      applied_date: status === 'Applied' ? today : undefined,
      followup_date: status === 'Applied' ? followup : undefined,
      notes: `Discovered via ${d.source} (${
        d.market === 'bangladesh' ? 'Bangladesh Market' : 'International Remote'
      })`,
      tags: d.tags,
      created_at: Date.now(),
    };
  };

  const handleSaveJob = (d: DiscoveredJob) => {
    const existing = findPipelineMatch(d);
    if (existing) {
      onNotify('info', `${d.company} is already in your pipeline (${existing.status})`);
      return;
    }
    const newJob = convertToPipelineJob(d, 'Saved');
    onSaveToPipeline(newJob);
    setPendingApplyIds((prev) => {
      const next = { ...prev };
      delete next[d.id];
      return next;
    });
  };

  const handleLaunchApply = (d: DiscoveredJob) => {
    window.open(d.url, '_blank', 'noopener,noreferrer');
    try {
      const note = generateTailoredCoverNote(d.company, d.title);
      navigator.clipboard.writeText(note);
    } catch {
      // clipboard permission optional
    }

    const existing = findPipelineMatch(d);
    if (existing?.status === 'Applied') return;

    setPendingApplyIds((prev) => ({ ...prev, [d.id]: d }));
  };

  const handleConfirmApplied = (d: DiscoveredJob) => {
    const existing = findPipelineMatch(d);
    const defaultCv = getStoredResumes().find((r) => r.isDefault);

    if (!existing) {
      const newJob = convertToPipelineJob(d, 'Applied');
      onSaveToPipeline(newJob);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + 7);
      onSaveToPipeline({
        ...existing,
        status: 'Applied',
        applied_date: today,
        followup_date: fDate.toISOString().slice(0, 10),
        resume_version: defaultCv?.label || existing.resume_version,
      });
    }

    setPendingApplyIds((prev) => {
      const next = { ...prev };
      delete next[d.id];
      return next;
    });
  };

  const handleDismissPending = (id: string) => {
    setPendingApplyIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const sourceCounts = useMemo(() => {
    const counts: Record<SourceFilter, number> = {
      All: discovered.length,
      'LinkedIn BD': 0,
      BDJobs: 0,
      Remotive: 0,
      Arbeitnow: 0,
    };
    for (const j of discovered) {
      if (counts[j.source] !== undefined) counts[j.source]++;
    }
    return counts;
  }, [discovered]);

  const filteredJobs = useMemo(() => {
    if (sourceFilter === 'All') return discovered;
    return discovered.filter((j) => j.source === sourceFilter);
  }, [discovered, sourceFilter]);

  const getSourceBadgeStyle = (source: DiscoveredJob['source']) => {
    switch (source) {
      case 'LinkedIn BD':
        return 'bg-blue-500/12 text-blue-600 dark:text-blue-400';
      case 'BDJobs':
        return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400';
      case 'Remotive':
        return 'bg-purple-500/12 text-purple-600 dark:text-purple-400';
      case 'Arbeitnow':
        return 'bg-amber-500/12 text-amber-700 dark:text-amber-400';
    }
  };

  const pendingList = Object.values(pendingApplyIds);

  return (
    <div className="space-y-4">
      {/* Top Confirmation Banner if user opened external job tabs */}
      {pendingList.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
          <div className="text-[13.5px] sm:text-[14px] text-[var(--ink)]">
            <span className="font-semibold">
              Did you finish applying to {pendingList[pendingList.length - 1].company}
            </span>{' '}
            <span className="text-[var(--muted)]">
              ({pendingList[pendingList.length - 1].title})? Confirm to add it to your Applied pipeline:
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleConfirmApplied(pendingList[pendingList.length - 1])}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Yes, mark Applied</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveJob(pendingList[pendingList.length - 1])}
              className="px-3 py-2 sm:py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] text-[13px] font-medium text-[var(--ink-secondary)] cursor-pointer"
            >
              Save for later
            </button>
            <button
              type="button"
              onClick={() => handleDismissPending(pendingList[pendingList.length - 1].id)}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] cursor-pointer"
              title="No, didn't apply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Control Header: Market Tabs + Search */}
      <div className="p-3.5 sm:p-4.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Responsive Market Switcher */}
          <div className="grid grid-cols-3 sm:inline-flex items-center p-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setMarket('all');
                setSourceFilter('All');
              }}
              className={`px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-[13px] sm:text-[13.5px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                market === 'all'
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>All Markets</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMarket('bangladesh');
                setSourceFilter('All');
              }}
              className={`px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-[13px] sm:text-[13.5px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                market === 'bangladesh'
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Bangladesh</span>
              <span className="hidden sm:inline">Bangladesh (LinkedIn & BDJobs)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMarket('remote');
                setSourceFilter('All');
              }}
              className={`px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-[13px] sm:text-[13.5px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                market === 'remote'
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Remote</span>
              <span className="hidden sm:inline">International Remote</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchFeed(activeQuery, market)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[var(--line)] text-[13px] sm:text-[13.5px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh live feed</span>
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type="search"
              placeholder="Search any job or industry (e.g. Bank, Marketing, HR, MTO, Sales, Designer, Engineer)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted)] text-[16px] sm:text-[14px] focus:outline-none focus:border-[var(--ink)] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[14px] font-semibold transition-colors cursor-pointer shrink-0"
          >
            Search jobs
          </button>
        </form>

        {/* Cross-Industry Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[12.5px] font-medium text-[var(--muted)] mr-1 shrink-0">
            Categories:
          </span>
          {CATEGORY_PRESETS.map((cat) => {
            const isSelected = activeQuery.toLowerCase() === cat.query.toLowerCase();
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => handlePresetClick(cat.query)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface-subtle)] text-[var(--ink)] border border-[var(--line)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['All', 'LinkedIn BD', 'BDJobs', 'Remotive', 'Arbeitnow'] as SourceFilter[]).map(
            (src) => {
              const count = sourceCounts[src];
              const active = sourceFilter === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
                  className={`px-3 py-1.5 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-[var(--ink)] text-[var(--bg)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span>{src}</span>
                  <span className="text-[12px] opacity-70 tabular-nums">{count}</span>
                </button>
              );
            }
          )}
        </div>

        {/* Direct BDJobs & LinkedIn BD Portal Launchers */}
        <div className="flex items-center gap-2.5 text-[12.5px] sm:text-[13px] text-[var(--muted)]">
          <span>Open portal search:</span>
          <a
            href={`https://jobs.bdjobs.com/jobsearch.asp?txtsearch=${encodeURIComponent(
              activeQuery || 'Executive'
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[var(--ink-secondary)] hover:text-[var(--ink)] font-semibold underline underline-offset-2"
          >
            BDJobs.com <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <span>·</span>
          <a
            href={`https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(
              activeQuery
            )}&location=Bangladesh`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[var(--ink-secondary)] hover:text-[var(--ink)] font-semibold underline underline-offset-2"
          >
            LinkedIn BD <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Results Grid (Full-width responsive columns) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pb-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="p-4.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] h-44 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-subtle)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[var(--surface-subtle)] rounded w-2/3" />
                  <div className="h-3.5 bg-[var(--surface-subtle)] rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-[var(--surface-subtle)] rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/50">
          <Building2 className="w-7 h-7 text-[var(--muted-subtle)] mx-auto mb-2.5" />
          <h3 className="text-[15px] font-semibold text-[var(--ink)]">
            No live jobs matched &ldquo;{activeQuery || 'All'}&rdquo;
          </h3>
          <p className="text-[13.5px] text-[var(--muted)] mt-1 max-w-sm mx-auto">
            Try another category chip above (Marketing, Finance, HR, Sales, Operations, MTO) or switch the source filter to All.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pb-8">
          {filteredJobs.map((item) => {
            const matchedJob = findPipelineMatch(item);
            const isPendingConfirm = Boolean(pendingApplyIds[item.id]);
            const initial = (item.company || '?').trim().charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-4.5 rounded-xl bg-[var(--surface)] border transition-all flex flex-col justify-between gap-3.5 shadow-2xs ${
                  isPendingConfirm
                    ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                    : 'border-[var(--line)] hover:border-[var(--muted-subtle)]'
                }`}
              >
                <div>
                  {/* Header: Logo/Initial + Company + Source Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line-subtle)] text-[var(--ink-secondary)] font-bold text-[15px] flex items-center justify-center shrink-0 overflow-hidden">
                        {item.companyLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.companyLogo}
                            alt={item.company}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-[var(--muted)] truncate">
                          {item.company}
                        </p>
                        <h3 className="font-semibold text-[15.5px] sm:text-[16px] text-[var(--ink)] leading-snug line-clamp-2 mt-0.5">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold shrink-0 ${getSourceBadgeStyle(
                        item.source
                      )}`}
                    >
                      {item.source}
                    </span>
                  </div>

                  {/* Metadata Pills */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] text-[var(--ink-secondary)] text-[12.5px] font-medium truncate max-w-[190px]">
                      {item.location}
                    </span>
                    {item.salary && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 text-[12.5px] font-semibold tabular-nums">
                        {item.salary}
                      </span>
                    )}
                    <span className="text-[12px] text-[var(--muted)] ml-auto tabular-nums">
                      {item.postedAt}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-[var(--line-subtle)]">
                  {isPendingConfirm ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-amber-500">
                        Did you apply?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmApplied(item)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Yes, Applied</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissPending(item.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] text-[12.5px] font-medium text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : matchedJob ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{matchedJob.status}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromPipeline(matchedJob.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          title="Undo / Remove from pipeline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {matchedJob.status === 'Saved' && (
                          <button
                            type="button"
                            onClick={() => handleConfirmApplied(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 text-emerald-500 hover:bg-emerald-600/25 text-[12.5px] font-semibold cursor-pointer"
                          >
                            Mark Applied
                          </button>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] text-[12.5px] font-medium text-[var(--ink-secondary)] inline-flex items-center gap-1"
                        >
                          <span>Posting</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveJob(item)}
                        className="px-3 py-2 sm:py-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--muted-subtle)] hover:bg-[var(--surface-hover)] text-[13.5px] font-medium text-[var(--ink-secondary)] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>Save</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLaunchApply(item)}
                        className="ml-auto px-3.5 py-2 sm:py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-[13.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Apply</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
