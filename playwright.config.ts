import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { activeSuite, suiteGrep } from './suites';

/** Set by `npm run suite -- <key>`; the suite's test cases are listed in suites.ts. */
const suite = activeSuite();

/**
 * See https://playwright.dev/docs/test-configuration.
 * Target environment comes from src/config/env.ts (ENV=prod|staging).
 */
export default defineConfig({
  testDir: './tests',
  grep: suite ? suiteGrep(suite) : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // Expected vs Actual report per test case. Suite runs (npm run suite) → reports/Entire Suite/<date-time>_<suite>/,
    // other runs → reports/Default/<date-time>/. See src/reporters/StepReporter.ts.
    ['./src/reporters/StepReporter.ts', { outputDir: 'reports', suiteName: suite?.name, suiteTestCases: suite?.testCases }],
  ],

  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'on',  // evidence for specs that don't use stepLog (stepLog captures its own)
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
