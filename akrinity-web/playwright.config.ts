import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests (see tests/README.md).
 *   E2E_BASE_URL   the site to test, for example https://ak-3-d.vercel.app (default: a local copy
 *                  that this config builds and starts for you on port 3000)
 *   E2E_BROWSER    path to a Chrome or Chromium program, if Playwright's own is not installed
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const launchOptions = process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {};

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npx next start -p 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 300_000,
      },
});
