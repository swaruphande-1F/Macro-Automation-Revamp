import { test, expect } from '@fixtures';
import { env } from '@config/env';
import { tc, testCase } from '@data/tc-imi-subindices-perf-06';
import { performance as budget, subindexList, subindexPath, subindices } from '@data/subindices';
import { ensureAt, openingSteps } from '@utils/flow';
import { measureCls, measureLcp } from '@utils/helpers';

/**
 * TC_IMI_SUBINDICES_PERF_06 — one test per step on ONE shared page (`flowPage`); see
 * subindices-e2e-01.spec.ts for how the flow and the step report work.
 * Timings come from a single run against production over the current network, so treat a
 * near-miss as a signal to re-run, not a verdict.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@performance', '@subindices'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  test(tc(1).title, tc(1).details, async ({ flowPage: page, stepLog }) => {
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

  test(tc(5).title, tc(5).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    // Navigation Timing only covers full page loads, so load /subindices fresh.
    await page.goto(subindices.path, { waitUntil: 'load' });
    await list.waitForLoaded();
    const t = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) };
    });
    stepLog.actual(`Time to first byte ${t.ttfb} ms; DOMContentLoaded ${t.dcl} ms; load ${t.load} ms (budget ${budget.loadBudgetMs} ms)`);
    expect(t.load, 'Page load (ms)').toBeLessThanOrEqual(budget.loadBudgetMs);
  });

  test(tc(6).title, tc(6).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    // Let late layout shifts (fonts, charts) happen before reading CLS.
    await page.waitForTimeout(2_000);
    const lcp = await measureLcp(page);
    const cls = await measureCls(page);
    stepLog.actual(`LCP ${lcp} ms (budget ${budget.maxLcpMs} ms); CLS ${cls.toFixed(3)} (budget ${budget.maxCls})`);
    expect.soft(lcp, 'LCP (ms)').toBeLessThanOrEqual(budget.maxLcpMs);
    expect(cls, 'CLS').toBeLessThanOrEqual(budget.maxCls);
  });

  test(tc(7).title, tc(7).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await list.setCharts(true);
    // Timed inside the page: click, then check the chart count on every animation frame.
    // (Playwright's assertion retries are too coarse to time something this quick.)
    const time = (count: number) => list.chartsSwitch.evaluate((toggle, want) => new Promise<number>((resolve) => {
      const started = performance.now();
      (toggle as HTMLElement).click();
      const tick = () => {
        const shown = document.querySelectorAll('main div.grid [data-highcharts-chart]').length;
        if (shown === want || performance.now() - started > 10_000) resolve(Math.round(performance.now() - started));
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), count);
    const hide = await time(0);
    await expect(list.charts).toHaveCount(0);
    const show = await time(subindices.cardCount);
    await expect(list.charts).toHaveCount(subindices.cardCount);
    stepLog.actual(`Hide charts: ${hide} ms; show charts: ${show} ms (budget ${budget.toggleBudgetMs} ms each)`);
    expect.soft(hide, 'Hide (ms)').toBeLessThanOrEqual(budget.toggleBudgetMs);
    expect(show, 'Show (ms)').toBeLessThanOrEqual(budget.toggleBudgetMs);
  });

  test(tc(8).title, tc(8).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    const target = subindexList[0];
    const started = Date.now();
    await list.card(target.title).knowMore.click();
    await page.waitForURL(`**${subindexPath(target.slug)}`);
    await detail.waitForLoaded();
    await detail.chart.root.waitFor();
    const elapsed = Date.now() - started;
    stepLog.actual(`Know more on "${target.title}" → heading and chart shown after ${elapsed} ms (budget ${budget.detailLoadBudgetMs} ms)`);
    expect(elapsed, 'Detail page load (ms)').toBeLessThanOrEqual(budget.detailLoadBudgetMs);
  });

  test(tc(9).title, tc(9).details, async ({ playwright, stepLog }) => {
    test.setTimeout(180_000);
    // Lighthouse is optional: install it with `npm i -D lighthouse` to run this step.
    const moduleName = 'lighthouse';
    let lighthouse: ((url: string, flags: Record<string, unknown>) => Promise<{ lhr: { categories: { performance: { score: number | null } } } } | undefined>) | undefined;
    try {
      const mod = await import(moduleName);
      lighthouse = mod.default ?? mod;
    } catch {
      stepLog.actual('Not run: the lighthouse package is not installed (npm i -D lighthouse).');
    }
    test.skip(!lighthouse, 'lighthouse package not installed — npm i -D lighthouse');

    const port = 9_333;
    const browser = await playwright.chromium.launch({ args: [`--remote-debugging-port=${port}`] });
    try {
      const url = new URL(subindices.path.slice(1), env.baseURL).href;
      const result = await lighthouse!(url, { port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] });
      const score = Math.round((result?.lhr.categories.performance.score ?? 0) * 100);
      stepLog.actual(`Lighthouse performance score for ${url}: ${score} (minimum ${budget.minLighthouseScore})`);
      expect(score).toBeGreaterThanOrEqual(budget.minLighthouseScore);
    } finally {
      await browser.close();
    }
  });
});
