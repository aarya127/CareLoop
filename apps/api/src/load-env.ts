// Loads local-dev environment variables from the repo-root .env BEFORE any
// module reads process.env. Imported first in main.ts.
//
// Previously the dev script relied on `tsx --env-file`; we now run the API with
// `nest start` (tsc) so that decorator metadata is emitted (fixing NestJS DI and
// ValidationPipe under local dev). `nest start` does not load .env itself, so we
// do it here. No-op in production (Render injects env directly) and never
// overrides variables that are already set.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

if (process.env.NODE_ENV !== 'production') {
  const candidates = [
    resolve(process.cwd(), '../../.env'), // cwd = apps/api (dev script)
    resolve(process.cwd(), '.env'), // cwd = repo root
    resolve(__dirname, '../../../.env'), // dist/main.js → repo root
    resolve(__dirname, '../../.env'), // src (ts-node/tsx) → repo root
  ];
  const envPath = candidates.find((p) => existsSync(p));
  if (envPath) {
    try {
      // Node ≥20.12; does not override already-set vars.
      (process as unknown as { loadEnvFile: (p: string) => void }).loadEnvFile(envPath);
    } catch {
      // best-effort: if unavailable, rely on the shell environment
    }
  }
}
