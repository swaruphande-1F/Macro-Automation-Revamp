import type { Page } from '@playwright/test';
import { test, expect } from '@fixtures';
import { browserJourneyStart, tc, testCase } from '@data/tc-imi-subindices-compat-05';
import { compatibility, subindex, subindexPath, subindices } from '@data/subindices';
import { ensureAt, openingSteps } from '@utils/flow';
import { runSubindicesJourney } from '@utils/journey';

/**
 * TC_IMI_SUBINDICES_COMPAT_05 — one test per step on ONE shared page (`flowPage`); see
 * subindices-e2e-01.spec.ts for how the flow and the step report work.
 * Steps 1–14 resize the Chromium flow page; steps 15–19 launch a separate browser per run.
 * "Tap" is a mouse click: the shared page has no touch support.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@compatibility', '@subindices'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  // The flow page is shared with other spec files in this worker: give back the default size.
  test.afterAll(async ({ flowPage }) => {
    await flowPage.setViewportSize({ width: 1280, height: 720 });
  });

  const rateOutlook = subindex('Interest Rate Outlook Index');

  /** Pixels the page is wider than the viewport (0 = no horizontal scroll). */
  const overflow = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  test(tc(1).title, tc(1).details, async ({ flowPage: page, stepLog }) => {
    await openingSteps.openBrowser(page, stepLog);
  });

  test(tc(2).title, tc(2).details, async ({ flowPage: page, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    const width = await page.evaluate(() => window.innerWidth);
    stepLog.actual(`Viewport ${compatibility.mobile.width} x ${compatibility.mobile.height}; page width ${width}px`);
    expect(width).toBe(compatibility.mobile.width);
  });

  test(tc(3).title, tc(3).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    await home.waitForLoaded();
    const hamburger = await home.header.hamburger.isVisible();
    const desktopNav = await home.header.topLevel('Economic Indicators').isVisible();
    stepLog.actual(`HTTP ${response?.status()}; heading "${await home.heroHeading.innerText()}"`);
    stepLog.actual(`Mobile layout: hamburger ${hamburger ? 'shown' : 'missing'}, desktop menu ${desktopNav ? 'shown' : 'hidden'}`);
    expect.soft(response?.status(), 'HTTP status').toBe(200);
    expect.soft(desktopNav, 'Desktop menu hidden').toBe(false);
    expect(hamburger, 'Hamburger shown').toBe(true);
  });

  test(tc(4).title, tc(4).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (await ensureAt(page, '/', stepLog)) await home.waitForLoaded();
    await home.header.hamburger.click();
    await expect.poll(() => home.header.isDrawerOpen(), { message: 'Drawer open' }).toBe(true);
    stepLog.actual(`Drawer open; items: ${(await home.header.drawerItems()).join(' | ')}`);
  });

  test(tc(5).title, tc(5).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (!(await home.header.isDrawerOpen())) {
      if (await ensureAt(page, '/', stepLog)) await home.waitForLoaded();
      await home.header.hamburger.click();
    }
    const item = home.header.drawerItem('India Macroeconomic Indices');
    const present = (await item.count()) > 0 && (await item.isVisible());
    if (!present) {
      stepLog.actual(`No "India Macroeconomic Indices" item in the drawer. Items: ${(await home.header.drawerItems()).join(' | ')}`);
    } else {
      await item.click();
      const sub = await home.header.drawerItem('Subindices').isVisible();
      stepLog.actual(`Tapped "India Macroeconomic Indices"; "Subindices" shown: ${sub}`);
      expect(sub, 'Submenu expanded').toBe(true);
    }
    expect(present, '"India Macroeconomic Indices" in the drawer').toBe(true);
  });

  test(tc(6).title, tc(6).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (!(await home.header.isDrawerOpen())) {
      if (await ensureAt(page, '/', stepLog)) await home.waitForLoaded();
      await home.header.hamburger.click();
    }
    await home.header.drawerItem('Subindices').click();
    await page.waitForURL(/\/subindices$/, { timeout: 5_000 }).catch(() => {});
    const path = new URL(page.url()).pathname;
    const open = await home.header.isDrawerOpen();
    stepLog.actual(`After tapping "Subindices": URL ${page.url()}; drawer ${open ? 'still open' : 'closed'}`);
    if (path !== subindices.path) {
      const links = await home.header.drawer.getByRole('link').filter({ visible: true }).allInnerTexts();
      stepLog.actual(`"Subindices" expanded in the drawer instead, showing: ${links.map((l) => l.trim()).join(' | ')}`);
    }
    expect.soft(open, 'Drawer closed').toBe(false);
    expect(path, 'Subindices page').toBe(subindices.path);
  });

  test(tc(7).title, tc(7).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    const xs = await list.cardRoots.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
    const columns = new Set(xs).size;
    const extra = await overflow(page);
    stepLog.actual(`${xs.length} cards in ${columns} column(s); horizontal overflow: ${extra}px`);
    expect.soft(columns, 'Single column').toBe(1);
    expect(extra, 'Horizontal scroll').toBeLessThanOrEqual(0);
  });

  test(tc(8).title, tc(8).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await list.setCharts(true);
    await list.clickChartsToggle();
    await expect(list.charts).toHaveCount(0);
    stepLog.actual(`Toggle ${(await list.chartsOn()) ? 'ON' : 'OFF'}; charts shown: ${await list.charts.count()}`);
  });

  test(tc(9).title, tc(9).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (await ensureAt(page, subindices.path, stepLog)) {
      await list.waitForLoaded();
      await list.setCharts(false);
    }
    await list.clickChartsToggle();
    await expect(list.charts).toHaveCount(subindices.cardCount);
    stepLog.actual(`Toggle ${(await list.chartsOn()) ? 'ON' : 'OFF'}; charts shown: ${await list.charts.count()}`);
  });

  test(tc(10).title, tc(10).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await list.setCharts(true);
    const card = list.card(0);
    const tooltip = await card.chart.hoverLastPoint({ tap: true });
    stepLog.actual(`${await card.titleText()}: tooltip "${tooltip}"`);
    expect(tooltip.length, 'Tooltip text').toBeGreaterThan(0);
  });

  test(tc(11).title, tc(11).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await list.card(rateOutlook.title).knowMore.click();
    await page.waitForURL(`**${subindexPath(rateOutlook.slug)}`);
    await detail.waitForLoaded();
    const hamburger = await detail.header.hamburger.isVisible();
    const extra = await overflow(page);
    stepLog.actual(`URL: ${page.url()}; heading "${(await detail.heading.innerText()).trim()}"`);
    stepLog.actual(`Mobile layout: hamburger ${hamburger ? 'shown' : 'missing'}; horizontal overflow ${extra}px`);
    expect.soft(extra, 'Horizontal scroll').toBeLessThanOrEqual(0);
    expect(hamburger, 'Mobile layout').toBe(true);
  });

  test(tc(12).title, tc(12).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await page.setViewportSize(compatibility.mobile);
    await ensureAt(page, subindexPath(rateOutlook.slug), stepLog, { from: subindices.path });
    await page.goBack();
    await list.waitForLoaded();
    stepLog.actual(`After Back: ${page.url()}`);
    expect(new URL(page.url()).pathname).toBe(subindices.path);
  });

  test(tc(13).title, tc(13).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await page.setViewportSize(compatibility.landscape);
    await page.waitForTimeout(500);
    const extra = await overflow(page);
    // Content is clipped when a card or chart runs past the right edge of the viewport.
    const clipped = await list.cardRoots.evaluateAll((els) =>
      els.filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).map((e) => e.querySelector('h2')?.textContent ?? '?'));
    stepLog.actual(`Landscape ${compatibility.landscape.width} x ${compatibility.landscape.height}: horizontal overflow ${extra}px; cards past the right edge: ${clipped.length ? clipped.join(', ') : 'none'}`);
    expect.soft(extra, 'Horizontal scroll').toBeLessThanOrEqual(0);
    expect(clipped, 'Clipped cards').toEqual([]);
  });

  test(tc(14).title, tc(14).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await page.setViewportSize(compatibility.desktop);
    const desktopNav = list.header.topLevel('Economic Indicators');
    await expect.soft(desktopNav, 'Desktop menu').toBeVisible();
    const hamburger = await list.header.hamburger.isVisible();
    const xs = await list.cardRoots.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
    stepLog.actual(`Viewport ${compatibility.desktop.width} x ${compatibility.desktop.height}: desktop menu ${(await desktopNav.isVisible()) ? 'shown' : 'hidden'}, hamburger ${hamburger ? 'shown' : 'hidden'}, ${new Set(xs).size} card columns`);
    expect(hamburger, 'Hamburger hidden').toBe(false);
  });

  compatibility.browsers.forEach((b, i) => {
    const n = browserJourneyStart + i;
    test(tc(n).title, tc(n).details, async ({ playwright, stepLog }) => {
      test.setTimeout(120_000);
      const channel = 'channel' in b ? b.channel : undefined;
      const result = await runSubindicesJourney(playwright[b.engine], { channel }).catch((e: Error) => ({
        lines: [`Could not run on ${b.name}: ${e.message.split('\n')[0]}`],
        problems: [`${b.name} did not launch`],
      }));
      for (const line of result.lines) stepLog.actual(line);
      expect(result.problems, `${b.name} journey`).toEqual([]);
    });
  });

  test(tc(19).title, tc(19).details, async ({ playwright, stepLog }) => {
    test.setTimeout(120_000);
    const result = await runSubindicesJourney(playwright.chromium, { viewport: compatibility.tablet });
    for (const line of result.lines) stepLog.actual(line);
    stepLog.actual(`Card grid at ${compatibility.tablet.width} x ${compatibility.tablet.height}: ${result.columns} column(s)`);
    expect.soft(result.columns, 'Tablet grid columns').toBe(compatibility.tabletColumns);
    expect(result.problems, 'Journey').toEqual([]);
  });
});
