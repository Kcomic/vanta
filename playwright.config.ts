import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // The reduced-motion suite only makes sense under the reduced-motion project below,
      // where prefers-reduced-motion is forced; exclude it from the default motion-on run.
      testIgnore: /reduced-motion\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'reduced-motion',
      testMatch: /reduced-motion\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        baseURL: 'http://localhost:3000',
        contextOptions: { reducedMotion: 'reduce' },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
