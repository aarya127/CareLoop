// Lightweight, dependency-free text embedding using hashing + character n-grams.
// Not semantically powerful, but good enough for local search demo without external APIs.

import type { Vector } from './types';

const DIMS = 384; // common small embedding size

function hashStr(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function l2Normalize(vec: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i];
  const norm = Math.sqrt(sum) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

export function embedText(text: string): Vector {
  const cleaned = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const vec = new Float32Array(DIMS);
  // char 3-grams
  for (let i = 0; i < cleaned.length - 2; i++) {
    const gram = cleaned.slice(i, i + 3);
    const h = hashStr(gram);
    const idx = h % DIMS;
    vec[idx] += 1;
  }
  // some token hashing
  for (const tok of cleaned.split(' ')) {
    if (!tok) continue;
    const h = hashStr(tok);
    vec[h % DIMS] += 2;
  }
  return Array.from(l2Normalize(vec));
}

export const embeddingDims = DIMS;
