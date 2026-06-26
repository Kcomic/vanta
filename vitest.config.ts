import { defineConfig } from 'vitest/config';
// @vitejs/plugin-react ships its own vite peer; vitest bundles a separate vite copy.
// The Plugin<any> type is structurally identical at runtime — the tsc error is a
// phantom type-only mismatch from the duplicate vite installs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // next/font modules are Next.js webpack transforms — stub them for Vitest.
      'next/font/local': fileURLToPath(
        new URL('./tests/__mocks__/next-font-local.ts', import.meta.url),
      ),
      'next/font/google': fileURLToPath(
        new URL('./tests/__mocks__/next-font-google.ts', import.meta.url),
      ),
      // geist/font/* re-exports from the geist package which uses next/font/local internally.
      // Provide consistent stubs so tests run without the Next.js build pipeline.
      'geist/font/sans': fileURLToPath(
        new URL('./tests/__mocks__/geist-font-sans.ts', import.meta.url),
      ),
      'geist/font/mono': fileURLToPath(
        new URL('./tests/__mocks__/geist-font-mono.ts', import.meta.url),
      ),
    },
  },
});
