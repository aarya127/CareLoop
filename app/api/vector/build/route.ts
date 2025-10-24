import { NextResponse } from 'next/server';
import { buildAndSaveIndex } from '@/lib/vector/build-index';

export async function POST() {
  try {
    const { count } = buildAndSaveIndex();
    return NextResponse.json({ ok: true, documents: count });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
