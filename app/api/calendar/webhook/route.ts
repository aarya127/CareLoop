import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Google sends notifications via headers. We must verify channelId/resourceId match a stored connection.
export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id') || undefined;
  const resourceId = req.headers.get('x-goog-resource-id') || undefined;
  const resourceState = req.headers.get('x-goog-resource-state') || undefined; // exists | sync | notFound
  if (!channelId || !resourceId) return new NextResponse('missing headers', { status: 400 });
  const conn = await prisma.googleCalendarConnection.findFirst({ where: { channelId, resourceId } });
  if (!conn) return new NextResponse('unknown channel', { status: 202 });
  // We do not echo the body. Trigger an async sync job here (queue) to fetch changes with syncToken.
  // For now, we just acknowledge. A background worker should call events.list with syncToken and update DB.
  return new NextResponse(null, { status: 204 });
}
