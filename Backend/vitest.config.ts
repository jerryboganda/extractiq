import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'packages/auth/src/**',
        'packages/shared-types/src/**',
        'apps/api/src/middleware/**',
        'apps/api/src/routes/**',
      ],
      exclude: ['**/*.test.ts', '**/index.ts'],
    },
  },
});
