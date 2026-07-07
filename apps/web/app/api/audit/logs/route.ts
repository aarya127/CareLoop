import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";

const clientLogSchema = z.object({
  action: z.string().min(1).max(120),
  patient_id: z.string().optional(),
  source: z.string().max(60).optional(),
  result: z.string().max(30).optional(),
  timestamp: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const bodySchema = z.object({
  logs: z.array(clientLogSchema).max(100),
});

/**
 * POST /api/audit/logs — persist client-side audit events into the shared
 * AuditLog table. The actor is always the authenticated session user; any
 * actor id supplied by the client is ignored (clients must not be able to
 * attribute events to someone else).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json());

    if (body.logs.length > 0) {
      await prisma.auditLog.createMany({
        data: body.logs.map((log) => ({
          eventType: log.action,
          outcome: log.result ?? "success",
          actorUserId: user.id,
          metadata: {
            ...(log.metadata ?? {}),
            patientId: log.patient_id,
            source: log.source ?? "web_client",
            clientTimestamp: log.timestamp,
            practiceId: user.practiceId,
          },
        })),
      });
    }

    return NextResponse.json({ success: true, count: body.logs.length });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    console.error("[Audit] Error logging:", error);
    return NextResponse.json({ error: "Failed to log audit" }, { status: 500 });
  }
}

/**
 * GET /api/audit/logs — query the audit trail. Requires an authenticated
 * session; only practice_admin/admin roles may read the audit log.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(sp.get("limit") ?? "100", 10) || 100, 500);
    const offset = parseInt(sp.get("offset") ?? "0", 10) || 0;

    const where: Record<string, unknown> = {};
    const action = sp.get("action");
    if (action) where.eventType = action;
    const actorId = sp.get("actor_id");
    if (actorId) where.actorUserId = actorId;
    const result = sp.get("result");
    if (result) where.outcome = result;
    const from = sp.get("from");
    const to = sp.get("to");
    if (from || to) {
      where.eventTime = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    const patientId = sp.get("patient_id");
    if (patientId) {
      where.metadata = { path: ["patientId"], equals: patientId };
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { eventTime: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: rows.map((r) => ({
        id: String(r.id),
        action: r.eventType,
        actor_id: r.actorUserId,
        result: r.outcome,
        timestamp: r.eventTime,
        metadata: r.metadata,
      })),
      total,
    });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    console.error("[Audit] Error querying:", error);
    return NextResponse.json({ error: "Failed to query audit logs" }, { status: 500 });
  }
}
