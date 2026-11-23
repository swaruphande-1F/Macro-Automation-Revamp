#!/usr/bin/env node
/**
 * Runs a suite defined in suites.ts and produces a suite report:
 *   reports/Entire Suite/<YYYY-MM-DD_HH-mm-ss>_<Suite name>/Summary-Report.html (+ one report per test case)
 *
 * Usage:
 *   npm run suite                          → master suite
 *   npm run suite -- subindices            → any key from suites.ts
 *   npm run suite -- regression --list     → anything after the key goes to Playwright
 *
 * Runs started any other way (npx playwright test …) write to reports/Default/<date-time>/.
 */
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const key = argv[0] && !argv[0].startsWith('-') ? argv.shift() : 'master';

// The compatibility steps launch extra browsers, so a full run is steadier with fewer workers.
const extra = argv.some((a) => a.startsWith('--workers') || a === '-j') ? [] : ['--workers=3'];
const args = ['playwright', 'test', ...extra, ...argv];
console.log(`Running suite "${key}" (see suites.ts): npx ${args.join(' ')}\n`);

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SUITE: key },
});
process.exit(result.status ?? 1);
