import { defineConfig, devices } from '@playwright/test';

/**
 * E2E + accessibility tests against a production build.
 * Needs the API running (API_BASE_URL). Set E2E_BASE_URL to test an already-running site;
 * otherwise `next start` is launched on port 3100. Locally this uses the installed Edge
 * (PW_CHANNEL=msedge, the default on Windows); CI installs Playwright's Chromium.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100';
const channel = process.env.PW_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL, channel, trace: 'retain-on-failure' },
  projects: [
    // Design widths: 1280 desktop, 390 mobile.
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel, viewport: { width: 390, height: 844 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run start -- -p 3100', url: baseURL, reuseExistingServer: true, timeout: 60_000 },
});
