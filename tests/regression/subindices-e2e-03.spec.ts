import type { Page } from '@playwright/test';
import { test, expect, type FlowMonitor, type StepLog } from '@fixtures';
import type { SubindicesPage } from '@pages';
import { env } from '@config/env';
import { directUrlStart, tc, testCase } from '@data/tc-imi-subindices-e2e-03';
import { negative, search, subindexList, subindexPath, subindices } from '@data/subindices';
import { consoleNoise, footer, thirdPartyNoise } from '@data/home';
import { ensureAt, openingSteps } from '@utils/flow';
import { measureCls } from '@utils/helpers';

/**
 * TC_IMI_SUBINDICES_E2E_03 — one test per step on ONE shared page (`flowPage`); see
 * subindices-e2e-01.spec.ts for how the flow and the step report work.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@e2e', '@subindices'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  /** Positions in the flow's console and network logs, so a later step can look at a slice. */
  type LogMark = { console: number; requests: number };
  const mark = (m: FlowMonitor): LogMark => ({ console: m.consoleErrors.length, requests: m.failedRequests.length });

  /** Back from `from` should land on /subindices. */
  async function backToSubindices(page: Page, from: string, list: SubindicesPage, log: StepLog) {
    await ensureAt(page, from, log, { from: subindices.path });
    await page.goBack();
    await list.waitForLoaded();
    log.actual(`After Back: ${page.url()}`);
    expect(new URL(page.url()).pathname).toBe(subindices.path);
  }

  test(tc(1).title, tc(1).details, async ({ flowPage: page, flowMonitor, stepLog }) => {
    // Step 36 checks the console and network logs from here on.
    flowMonitor.state.e2e03Start = mark(flowMonitor);
    await openingSteps.openBrowser(page, stepLog);
  });

  test(tc(2).title, tc(2).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await openingSteps.openHome(page, home, stepLog);
  });

  test(tc(3).title, tc(3).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await openingSteps.openIndicesMenu(page, home, stepLog);
  });

  test(tc(4).title, tc(4).details, async ({ flowPage: page, flowHomePage: home, flowSubindicesPage: list, stepLog }) => {
    await openingSteps.clickSubindices(page, home, list, stepLog);
  });

  test(tc(5).title, tc(5).details, async ({ flowPage: page, flowSubindicesPage: list, flowHomePage: home, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.header.goHome();
    await page.waitForURL((url) => url.pathname === '/');
    await home.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; title "${await page.title()}"`);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test(tc(6).title, tc(6).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await backToSubindices(page, '/', list, stepLog);
  });

  test(tc(7).title, tc(7).details, async ({ flowPage: page, flowSubindicesPage: list, flowHomePage: home, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.breadcrumbHome.click();
    await page.waitForURL((url) => url.pathname === '/');
    await home.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; title "${await page.title()}"`);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test(tc(8).title, tc(8).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await backToSubindices(page, '/', list, stepLog);
  });

  test(tc(9).title, tc(9).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.header.searchButton.click();
    const shown = await list.header.searchInput.isVisible({ timeout: 5_000 }).catch(() => false);
    stepLog.actual(`Search input: ${shown ? `shown (placeholder "${await list.header.searchInput.getAttribute('placeholder')}")` : 'not shown'}`);
    await expect(list.header.searchInput).toBeVisible();
  });

  test(tc(10).title, tc(10).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    if (!(await list.header.searchInput.isVisible())) await list.header.searchButton.click();
    await list.header.searchInput.fill(search.term);
    const result = list.header.searchResult(search.result.title);
    await expect(result).toBeVisible();
    stepLog.actual(`Typed "${search.term}" → first match: "${(await result.innerText()).replace(/\s+/g, ' ').trim()}" (${await result.getAttribute('href')})`);
    expect(await result.getAttribute('href')).toBe(subindexPath(search.result.slug));
  });

  test(tc(11).title, tc(11).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog) || !(await list.header.searchInput.isVisible())) {
      await list.header.search(search.term);
    }
    await list.header.searchResult(search.result.title).click();
    await page.waitForURL(`**${subindexPath(search.result.slug)}`);
    await detail.waitForLoaded();
    const heading = (await detail.heading.innerText()).trim();
    stepLog.actual(`URL: ${page.url()}; heading "${heading}"`);
    expect(heading).toBe(search.result.title);
  });

  test(tc(12).title, tc(12).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await backToSubindices(page, subindexPath(search.result.slug), list, stepLog);
  });

  test(tc(13).title, tc(13).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.footer.root.scrollIntoViewIfNeeded();
    const text = (await list.footer.root.innerText()).replace(/\s+/g, ' ');
    const cin = text.match(footer.cin)?.[0];
    const sections = footer.sections.filter((s) => text.includes(s));
    stepLog.actual(`CIN: ${cin ?? 'not found'}`);
    stepLog.actual(`Sections found: ${sections.join(', ')}`);

    expect.soft(cin, 'CIN No').toBeTruthy();
    expect(sections).toEqual(footer.sections);
  });

  test(tc(14).title, tc(14).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.footer.root.getByRole('link', { name: 'Subindices', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'Scrolled to the top' }).toBe(0);
    await list.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; scroll position: ${await page.evaluate(() => window.scrollY)}px`);
    expect(new URL(page.url()).pathname).toBe(subindices.path);
  });

  test(tc(15).title, tc(15).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.footer.root.getByRole('link', { name: 'Economic Indicators', exact: true }).click();
    await page.waitForURL('**/economic-indicators');
    const heading = (await page.getByRole('heading', { level: 1 }).innerText()).trim();
    stepLog.actual(`URL: ${page.url()}; heading "${heading}"`);
    expect(heading).toBe('Economic Indicators');
  });

  test(tc(16).title, tc(16).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await backToSubindices(page, '/economic-indicators', list, stepLog);
  });

  test(tc(17).title, tc(17).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    test.setTimeout(240_000);
    await ensureAt(page, subindices.path, stepLog);
    const origin = new URL(env.baseURL).origin;
    const done = ['Subindices', 'Economic Indicators'];
    const links = (await list.footer.linkData()).filter((l) => l.text && !done.includes(l.text));
    const problems: string[] = [];
    for (const { text, href, target } of links) {
      const status = (await page.request.get(href)).status();
      if (status !== 200) problems.push(`${text} returned ${status}`);
      if (!href.startsWith(origin)) {
        // External links open in a new tab, so there is nothing to go Back from.
        stepLog.actual(`${text} → HTTP ${status}, external, new tab: ${target === '_blank'}`);
        if (target !== '_blank') problems.push(`${text} does not open in a new tab`);
        continue;
      }
      await list.footer.root.getByRole('link', { name: text, exact: true }).first().click();
      await page.waitForURL(href);
      await page.goBack();
      await page.waitForURL(`**${subindices.path}`).catch(() => {});
      const back = new URL(page.url()).pathname;
      stepLog.actual(`${text} → ${href} HTTP ${status}; Back → ${back}`);
      if (back !== subindices.path) {
        problems.push(`Back from ${text} went to ${back}`);
        await page.goto(subindices.path);
      }
    }
    stepLog.actual(`${links.length} links checked, ${problems.length} problems`);
    expect(problems).toEqual([]);
  });

  test(tc(18).title, tc(18).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    const response = await page.goto(new URL('subindices', env.baseURL).href);
    await list.waitForLoaded();
    const count = await list.cardRoots.count();
    stepLog.actual(`HTTP ${response?.status()}; ${count} cards`);
    expect.soft(response?.status(), 'HTTP status').toBe(200);
    expect(count, 'Cards').toBe(subindices.cardCount);
  });

  subindexList.forEach(({ title, slug }, i) => {
    const n = directUrlStart + i;
    test(tc(n).title, tc(n).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      const response = await page.goto(new URL(subindexPath(slug).slice(1), env.baseURL).href);
      await detail.waitForLoaded();
      const heading = (await detail.heading.innerText()).trim();
      stepLog.actual(`HTTP ${response?.status()}; heading "${heading}"; title "${await page.title()}"`);
      expect.soft(response?.status(), 'HTTP status').toBe(200);
      expect(heading, 'Heading').toBe(title);
    });
  });

  test(tc(27).title, tc(27).details, async ({ flowPage: page, stepLog }) => {
    const response = await page.goto(negative.invalidPath, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    const hasHome = await page.getByRole('link', { name: negative.homeLinkName }).isVisible();
    stepLog.actual(`HTTP ${response?.status()}; title "${title}"; "${negative.homeLinkName}" link: ${hasHome ? 'shown' : 'missing'}`);
    expect.soft(response?.status(), 'HTTP status').toBe(404);
    expect.soft(title, '404 page title').toMatch(negative.notFoundTitle);
    expect(hasHome, 'Link back to Home').toBe(true);
  });

  test(tc(28).title, tc(28).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const homeLink = page.getByRole('link', { name: negative.homeLinkName });
    if (!(await homeLink.isVisible())) {
      // The invalid subindex URL may not show the 404 page, so reach it through another unknown path.
      await page.goto(negative.upperCasePath, { waitUntil: 'domcontentloaded' });
      stepLog.actual(`(No Home link on ${negative.invalidPath} — used the 404 page at ${negative.upperCasePath})`);
    }
    await homeLink.click();
    await page.waitForURL((url) => url.pathname === '/');
    await home.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; title "${await page.title()}"`);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test(tc(29).title, tc(29).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    const response = await page.goto(negative.upperCasePath, { waitUntil: 'domcontentloaded' });
    const status = response?.status() ?? 0;
    const isListing = new URL(page.url()).pathname === subindices.path && (await list.heading.isVisible());
    stepLog.actual(`HTTP ${status}; ended on ${page.url()}; title "${await page.title()}"; Subindices page shown: ${isListing}`);
    expect.soft(status, 'No server error').toBeLessThan(500);
    expect(isListing, 'Subindices page shown or redirected to /subindices').toBe(true);
  });

  // Steps 30–32 mock "the subindices data request". The page is server-rendered: the browser
  // gets the data inside the HTML (and as a Next.js RSC payload on in-app navigation), never
  // from a separate API call, so a browser-side mock cannot feed the page an error, an empty
  // list or a null value on reload. They need a test server with a mockable backend.
  const serverRendered = 'Subindices data is server-rendered; there is no browser data request to mock on reload. Needs a test server with a mockable backend.';
  for (const n of [30, 31, 32]) {
    test(tc(n).title, tc(n).details, async ({ stepLog }) => {
      stepLog.actual(`Not automated: ${serverRendered}`);
      test.fixme(true, serverRendered);
    });
  }

  test(tc(33).title, tc(33).details, async ({ flowPage: page, flowSubindicesPage: list, flowMonitor, stepLog }) => {
    // Failures from here to step 35 come from the throttled and offline network, not the site.
    flowMonitor.state.e2e03MockFrom = mark(flowMonitor);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', negative.slow3G);
    try {
      const started = Date.now();
      await page.goto(subindices.path, { waitUntil: 'commit', timeout: 120_000 });
      // Sample until the cards are in: were skeletons shown first, or did the cards come in the HTML?
      let skeletonSeen = false;
      let cardsAt = -1;
      while (Date.now() - started < 60_000) {
        if ((await page.locator(negative.skeleton).count()) > 0) skeletonSeen = true;
        if ((await list.cardRoots.count()) === subindices.cardCount) {
          cardsAt = Date.now() - started;
          break;
        }
        await page.waitForTimeout(100);
      }
      await page.waitForLoadState('load', { timeout: 120_000 });
      const cls = await measureCls(page);
      stepLog.actual(`Slow 3G: all ${subindices.cardCount} cards after ${cardsAt} ms; skeleton loaders seen: ${skeletonSeen}`);
      if (!skeletonSeen) stepLog.actual('The cards arrive in the server-rendered HTML, so there is no loading state for a skeleton.');
      stepLog.actual(`Layout shift (CLS) during load: ${cls.toFixed(3)}`);
      expect.soft(cardsAt, 'Cards loaded').toBeGreaterThan(-1);
      expect(cls, 'Layout shift (CLS)').toBeLessThanOrEqual(negative.maxCls);
    } finally {
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      await cdp.detach();
    }
  });

  test(tc(34).title, tc(34).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.waitForLoaded();
    const crashes: string[] = [];
    const onError = (e: Error) => crashes.push(e.message);
    page.on('pageerror', onError);
    await page.context().setOffline(true);
    try {
      const target = subindexList[0];
      await list.card(target.title).knowMore.click();
      await page.waitForTimeout(3_000);
      const url = page.url();
      const browserError = url.startsWith('chrome-error://');
      const body = browserError ? '' : (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 150);
      stepLog.actual(`Offline click on "${target.title}" Know more → ${url}`);
      stepLog.actual(browserError ? "The browser's own offline error page is shown" : `Page content: "${body}…"`);
      stepLog.actual(`Uncaught JavaScript errors: ${crashes.length ? crashes.join(' | ') : 'none'}`);
      expect.soft(browserError, 'Site handles offline itself (not the browser error page)').toBe(false);
      expect(crashes, 'App crashed').toEqual([]);
    } finally {
      page.off('pageerror', onError);
      await page.context().setOffline(false);
    }
  });

  test(tc(35).title, tc(35).details, async ({ flowPage: page, flowSubindicesPage: list, flowMonitor, stepLog }) => {
    await page.context().setOffline(false);
    const response = await page.goto(subindices.path, { waitUntil: 'domcontentloaded' });
    await list.waitForLoaded();
    const count = await list.cardRoots.count();
    flowMonitor.state.e2e03MockTo = mark(flowMonitor);
    stepLog.actual(`Online; HTTP ${response?.status()}; ${count} cards`);
    expect.soft(response?.status(), 'HTTP status').toBe(200);
    expect(count, 'Cards').toBe(subindices.cardCount);
  });

  test(tc(36).title, tc(36).details, async ({ flowMonitor, stepLog }) => {
    const end = mark(flowMonitor);
    const start = (flowMonitor.state.e2e03Start as LogMark | undefined) ?? { console: 0, requests: 0 };
    const from = (flowMonitor.state.e2e03MockFrom as LogMark | undefined) ?? end;
    const to = (flowMonitor.state.e2e03MockTo as LogMark | undefined) ?? end;
    if (!flowMonitor.state.e2e03Start) stepLog.actual('(Earlier steps ran in another worker — only this worker’s logs are checked)');
    // Leave out the throttled/offline window and the error pages this case opened on purpose.
    const outside = <T>(log: T[], key: keyof LogMark) => [...log.slice(start[key], from[key]), ...log.slice(to[key], end[key])];
    const deliberate = [negative.invalidPath, negative.upperCasePath.replace(/\/$/, '')];
    const errors = outside(flowMonitor.consoleErrors, 'console')
      .filter((e) => !consoleNoise.some((re) => re.test(e)))
      // The browser also logs the deliberate 404/500 page responses as console errors.
      .filter((e) => !/Failed to load resource: the server responded with a status of (404|500)/.test(e));
    const requests = outside(flowMonitor.failedRequests, 'requests')
      .filter((r) => !thirdPartyNoise.some((re) => re.test(r)))
      .filter((r) => !deliberate.some((d) => r.includes(d)));
    stepLog.actual(`Console errors: ${errors.length}${errors.length ? ` — ${errors.join(' | ')}` : ''}`);
    stepLog.actual(`Unexpected 4xx/5xx or failed requests: ${requests.length}${requests.length ? ` — ${requests.join(' | ')}` : ''}`);
    expect.soft(errors, 'Console errors').toEqual([]);
    expect(requests, 'Failed requests').toEqual([]);
  });
});
