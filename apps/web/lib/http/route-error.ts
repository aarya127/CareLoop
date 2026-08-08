import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function routeError(error: unknown): Response {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }
  console.error('[api-route] request failed', error);
  return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
}
