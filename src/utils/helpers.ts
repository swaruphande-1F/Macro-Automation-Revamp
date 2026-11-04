import type { Page } from '@playwright/test';
import { maxAgeDays, type Frequency } from '../data/home';

/** Scrolls to the bottom gradually so lazy-loaded sections render. */
export async function scrollToBottom(page: Page, step = 600): Promise<void> {
  await page.evaluate(async (s) => {
    for (let y = 0; y < document.body.scrollHeight; y += s) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  }, step);
}

/** Collects console errors raised while the page is open. Call before navigation. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/**
 * Collects 4xx/5xx responses and requests that fail outright. Call before navigation.
 * `ignore` skips third-party noise, e.g. [/google-analytics/].
 */
export function trackFailedRequests(page: Page, ignore: RegExp[] = []): string[] {
  const failures: string[] = [];
  const skip = (url: string) => ignore.some((re) => re.test(url));

  page.on('response', (res) => {
    if (res.status() >= 400 && !skip(res.url())) failures.push(`${res.status()} ${res.url()}`);
  });
  page.on('requestfailed', (req) => {
    const error = req.failure()?.errorText ?? '';
    // Navigating away cancels in-flight requests; that's expected, not a failure.
    if (error.includes('ERR_ABORTED') || skip(req.url())) return;
    failures.push(`FAILED ${req.url()} (${error})`);
  });

  return failures;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthIndex(name: string): number {
  const i = MONTHS.indexOf(name.slice(0, 3).toLowerCase());
  if (i < 0) throw new Error(`Unknown month "${name}"`);
  return i;
}

/**
 * Parses a "Last updated" value. Month and quarter dates resolve to the END of the period:
 *   "3 Nov, 2026" → 3 Nov 2026
 *   "Sep, 2026"   → 30 Sep 2026
 *   "Q1 FY2027"   → 30 Jun 2026 (FY2027 = Apr 2026 – Mar 2027)
 */
export function parseSiteDate(text: string): Date {
  const day = text.match(/\b(\d{1,2}) ([A-Za-z]{3,4}),? (\d{4})\b/);
  if (day) return new Date(Number(day[3]), monthIndex(day[2]), Number(day[1]));

  const month = text.match(/\b([A-Za-z]{3,4}),? (\d{4})\b/);
  if (month) return new Date(Number(month[2]), monthIndex(month[1]) + 1, 0);

  const quarter = text.match(/\bQ([1-4]) FY(\d{4})\b/);
  if (quarter) {
    const fyStartYear = Number(quarter[2]) - 1;
    return new Date(fyStartYear, 3 + Number(quarter[1]) * 3, 0);
  }

  throw new Error(`No date found in "${text}"`);
}

/** Whole days from `date` to today's midnight. */
export function daysSince(date: Date, today = new Date()): number {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((midnight.getTime() - date.getTime()) / 86_400_000);
}

export function isFresh(date: Date, frequency: Frequency, limit = maxAgeDays[frequency], today = new Date()): boolean {
  return daysSince(date, today) <= limit;
}
