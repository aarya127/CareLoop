import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { Prisma } from '@careloop/db';
import type { ExportDataJobData } from '@careloop/shared';

async function auditExport(eventType: string, outcome: string, meta: Prisma.InputJsonValue): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { eventType, outcome, authMethod: 'system', metadata: meta },
    });
  } catch { /* never crash the worker */ }
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCsvField(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCsvField(r[h])).join(',')),
  ];
  return lines.join('\n');
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function exportPatients(practiceId: string) {
  const rows = await prisma.patient.findMany({
    where: { practiceId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      phoneE164: true,
      patientType: true,
      createdAt: true,
    },
    orderBy: { lastName: 'asc' },
  });
  return rows.map((r) => ({ ...r, dateOfBirth: r.dateOfBirth?.toISOString().slice(0, 10), createdAt: r.createdAt.toISOString() }));
}

async function exportAppointments(practiceId: string) {
  const rows = await prisma.appointment.findMany({
    where: { practiceId },
    select: {
      id: true,
      title: true,
      status: true,
      start: true,
      end: true,
      source: true,
      createdAt: true,
    },
    orderBy: { start: 'desc' },
    take: 5000, // cap to avoid memory issues
  });
  return rows.map((r) => ({ ...r, start: r.start.toISOString(), end: r.end.toISOString(), createdAt: r.createdAt.toISOString() }));
}

async function exportBilling(practiceId: string) {
  const rows = await prisma.invoice.findMany({
    where: { practiceId },
    select: {
      id: true,
      patientId: true,
      totalAmountCents: true,
      status: true,
      issuedAt: true,
      dueDate: true,
      paidAt: true,
    },
    orderBy: { issuedAt: 'desc' },
    take: 5000,
  });
  return rows.map((r) => ({
    ...r,
    issuedAt: r.issuedAt?.toISOString(),
    dueDate: r.dueDate?.toISOString(),
    paidAt: r.paidAt?.toISOString(),
    amountDollars: ((r.totalAmountCents ?? 0) / 100).toFixed(2),
  }));
}

// ── Processor ─────────────────────────────────────────────────────────────────

export async function exportsProcessor(
  job: Job<ExportDataJobData>,
): Promise<{ rowCount: number; preview: string }> {
  const { resource, format, requestedBy, practiceId } = job.data;
  job.log(`Export started: resource=${resource} format=${format} requestedBy=${requestedBy} practice=${practiceId}`);

  let rows: Record<string, unknown>[];
  if (resource === 'patients') rows = await exportPatients(practiceId);
  else if (resource === 'appointments') rows = await exportAppointments(practiceId);
  else if (resource === 'billing') rows = await exportBilling(practiceId);
  else throw new Error(`Unknown export resource: ${resource}`);

  const output = format === 'csv' ? toCsv(rows) : JSON.stringify(rows, null, 2);

  // TODO: upload `output` to S3 and send a download link to requestedBy
  // For now, log a preview and return metadata.
  job.log(`Export complete: rows=${rows.length} bytes=${output.length}`);
  job.log(`Preview (first 200 chars): ${output.slice(0, 200)}`);

  void auditExport('analytics_export_completed', 'success', {
    resource,
    format,
    requestedBy,
    practiceId,
    rowCount: rows.length,
  } as Prisma.InputJsonValue);

  return { rowCount: rows.length, preview: output.slice(0, 200) };
}
