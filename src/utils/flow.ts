import { expect, type Page } from '@playwright/test';
import { env } from '../config/env';
import type { StepLog } from '../fixtures';
import type { HomePage, SubindicesPage } from '../pages';
import { homeTitle } from '../data/home';
import { subindices } from '../data/subindices';

/** Path of the page the flow is on, or null on a fresh (about:blank) or off-site page. */
export function currentPath(page: Page): string | null {
  if (page.url() === 'about:blank') return null;
  const url = new URL(page.url());
  return url.origin === new URL(env.baseURL).origin ? url.pathname : null;
}

/**
 * Makes sure the shared flow page is on `path`. After a failed step Playwright gives the
 * next step a fresh page, so each step calls this to pick up where the flow should be.
 * `from` is opened first so that a following Back step has somewhere to go.
 * Returns true (and logs it) when it had to navigate.
 */
export async function ensureAt(page: Page, path: string, log: StepLog, opts: { from?: string } = {}): Promise<boolean> {
  if (currentPath(page) === path) return false;
  if (opts.from) await page.goto(opts.from, { waitUntil: 'domcontentloaded' });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  log.actual(`(Flow was not on ${path} — opened it directly)`);
  return true;
}

/** The four steps every Subindices case starts with: browser, home page, menu, Subindices. */
export const openingSteps = {
  async openBrowser(page: Page, log: StepLog): Promise<void> {
    const browser = page.context().browser();
    log.actual(`Browser launched: ${browser?.browserType().name()} ${browser?.version()}`);
    expect(browser?.isConnected(), 'Browser connected').toBe(true);
  },

  async openHome(page: Page, home: HomePage, log: StepLog): Promise<void> {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    await home.waitForLoaded();
    const title = await page.title();
    log.actual(`Opened ${page.url()} → HTTP ${response?.status()}, title "${title}"`);
    expect.soft(response?.status(), 'HTTP status').toBe(200);
    expect(title, 'Home page title').toBe(homeTitle);
  },

  async openIndicesMenu(page: Page, home: HomePage, log: StepLog): Promise<void> {
    await ensureAt(page, '/', log);
    const menu = 'India Macroeconomic Indices';
    await home.header.openMenu(menu);
    // The panel is always in the DOM and fades in (opacity 0 → 1) on hover.
    await expect.soft(home.header.dropdown(menu), 'Dropdown faded in').toHaveCSS('opacity', '1');
    const options = await home.header.dropdown(menu).locator('p').evaluateAll((ps) =>
      ps.map((p) => (p.textContent ?? '').trim()).filter((t) => t && t.length < 60),
    );
    log.actual(`Menu options shown: ${options.join(', ')}`);
    expect(options, 'Menu options').toEqual(expect.arrayContaining(['1 Finance Macroeconomic Index', 'Subindices']));
  },

  async clickSubindices(page: Page, home: HomePage, list: SubindicesPage, log: StepLog): Promise<void> {
    await ensureAt(page, '/', log);
    await home.header.navigate('India Macroeconomic Indices', 'Subindices');
    await page.waitForURL(/\/subindices$/);
    await list.waitForLoaded();
    log.actual(`URL: ${page.url()}; heading "${await list.heading.innerText()}"`);
    expect(new URL(page.url()).pathname, 'URL').toBe(subindices.path);
  },
};
