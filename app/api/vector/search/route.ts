import { NextRequest, NextResponse } from 'next/server';
import { loadIndex, searchIndex } from '@/lib/vector/store';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const k = Number(url.searchParams.get('k') || 8);
    const index = loadIndex();
    if (!index) return NextResponse.json({ ok: false, error: 'index_not_built' }, { status: 400 });
    const results = searchIndex(index, q, k);
    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
