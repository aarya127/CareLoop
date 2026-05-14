import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'cl_session';
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  practiceId: string;
}

/**
 * Validates the session cookie by calling the API's /auth/me.
 * Returns the user or throws a 401 Response.
 */
export async function requireUser(req: NextRequest): Promise<SessionUser> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return res.json() as Promise<SessionUser>;
}

/**
 * Returns the current user from the session cookie, or null if not authenticated.
 * Use in server components and layouts.
 */
export async function getUser(req: NextRequest): Promise<SessionUser | null> {
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}

