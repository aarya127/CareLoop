import fs from 'fs';
import path from 'path';
import { embedText, embeddingDims } from './embed';
import type { Document, Vector, VectorIndex, SearchResult } from './types';

function cosineSim(a: Vector, b: Vector): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}

export function buildIndex(docs: Document[]): VectorIndex {
  const embedded = docs.map((d) => ({
    ...d,
    vector: d.vector ?? embedText(d.text),
  }));
  return {
    dims: embeddingDims,
    createdAt: new Date().toISOString(),
    docCount: embedded.length,
    documents: embedded,
  };
}

export function searchIndex(index: VectorIndex, query: string, k = 8): SearchResult[] {
  const qv = embedText(query);
  const scored = index.documents.map((d) => ({
    id: d.id,
    source: d.source,
    text: d.text,
    metadata: d.metadata,
    score: cosineSim(qv, d.vector),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

export function getIndexPath(): string {
  // store under .next/cache/vector-index.json so it isn't committed
  // falls back to project root if .next isn't present
  const projectRoot = process.cwd();
  const cacheDir = path.join(projectRoot, '.next', 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return path.join(cacheDir, 'vector-index.json');
}

export function saveIndex(index: VectorIndex) {
  const p = getIndexPath();
  fs.writeFileSync(p, JSON.stringify(index, null, 2), 'utf-8');
}

export function loadIndex(): VectorIndex | null {
  const p = getIndexPath();
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw) as VectorIndex;
}
