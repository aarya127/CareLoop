'use client';

import { useCallback, useEffect, useState } from 'react';
import { auditApi, type AuditFilters, type AuditLogEntry } from '@/lib/api/audit';

// ─── helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── small components ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />;
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (outcome === 'success') return <span className={`${base} bg-emerald-50 text-emerald-700`}>success</span>;
  if (outcome === 'failure') return <span className={`${base} bg-rose-50 text-rose-700`}>failure</span>;
  return <span className={`${base} bg-muted text-muted-foreground`}>{outcome}</span>;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  // Filters
  const [eventType, setEventType] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [outcome, setOutcome] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Applied filters (separate so user can edit without triggering immediate fetch)
  const [applied, setApplied] = useState<AuditFilters>({});

  // Data
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail row expansion
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (filters: AuditFilters, pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.getLog({
        ...filters,
        limit: PAGE_SIZE,
        offset: pageIndex * PAGE_SIZE,
      });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(applied, page);
  }, [applied, page, load]);

  function apply() {
    const filters: AuditFilters = {};
    if (eventType.trim()) filters.eventType = eventType.trim();
    if (actorUserId.trim()) filters.actorUserId = actorUserId.trim();
    if (outcome) filters.outcome = outcome;
    if (from) filters.from = from;
    if (to) filters.to = to;
    setApplied(filters);
    setPage(0);
  }

  function reset() {
    setEventType('');
    setActorUserId('');
    setOutcome('');
    setFrom('');
    setTo('');
    setApplied({});
    setPage(0);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete activity trail for compliance and investigation.
          {total > 0 && !loading && ` ${total.toLocaleString()} entries`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Event type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Event type</label>
            <input
              type="text"
              placeholder="e.g. user.login"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Actor (user ID)</label>
            <input
              type="text"
              placeholder="User UUID"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Outcome */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Date range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={apply}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={reset}
            className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Event Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Outcome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">IP</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No audit log entries match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <>
                    <tr
                      key={row.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground text-xs">
                        {fmtDate(row.eventTime)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.eventType}</td>
                      <td className="px-4 py-3">
                        <OutcomeBadge outcome={row.outcome} />
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground max-w-[160px] truncate">
                        {row.actorUserId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {row.ip ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.sessionId ? (
                          <span className="font-mono truncate max-w-[120px] inline-block">{row.sessionId}</span>
                        ) : '—'}
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr key={`${row.id}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-muted/20">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                            <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{row.id}</span></div>
                            <div><span className="text-muted-foreground">Auth method:</span> {row.authMethod ?? '—'}</div>
                            <div><span className="text-muted-foreground">Session:</span> <span className="font-mono">{row.sessionId ?? '—'}</span></div>
                            <div><span className="text-muted-foreground">Request ID:</span> <span className="font-mono">{row.requestId ?? '—'}</span></div>
                            <div><span className="text-muted-foreground">Target user:</span> <span className="font-mono">{row.targetUserId ?? '—'}</span></div>
                          </div>
                          {row.metadata && Object.keys(row.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Metadata</summary>
                              <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                                {JSON.stringify(row.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages} ({total.toLocaleString()} entries)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-md border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="rounded-md border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
