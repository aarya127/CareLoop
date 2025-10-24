import { NextRequest } from 'next/server';

export function requireUser(req: NextRequest): { id: string; email?: string } {
  const userId = req.headers.get('x-user-id') || process.env.DEMO_USER_ID;
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return { id: userId };
}
