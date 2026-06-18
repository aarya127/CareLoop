import { defineConfig } from 'vitest/config';

export default defineConfig({
  // NestJS providers use class/parameter decorators. We instantiate units
  // directly in tests (no Nest DI container), so esbuild only needs to accept
  // the legacy-decorator syntax — reflect-metadata is not required here.
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // argon2 hashing is intentionally slow; give password tests headroom.
    testTimeout: 15_000,
  },
});
