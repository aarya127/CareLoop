import { defineConfig } from 'vitest/config';

export default defineConfig({
  // NestJS providers and transformed DTOs use legacy decorators.
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    include: ['src/**/*.spec.ts'],
    // argon2 hashing is intentionally slow; give password tests headroom.
    testTimeout: 15_000,
  },
});
