import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'https://careloop-tf2l.onrender.com';

// Vector search is handled by the NestJS API on Render (which has persistent storage).
// Running it as a Next.js serverless function would exceed the 250 MB size limit.
export async function GET(req: NextRequest) {
  try {
    const { search } = new URL(req.url);
    const upstream = await fetch(`${API_URL}/vector/search${search}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 502 }
    );
  }
}
