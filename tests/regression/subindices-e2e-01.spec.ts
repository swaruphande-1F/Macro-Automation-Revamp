import { test, expect } from '@fixtures';
import { cardFieldsStart, tc, testCase } from '@data/tc-imi-subindices-e2e-01';
import { subindex, subindexList, subindexPath, subindices } from '@data/subindices';
import { ensureAt, openingSteps } from '@utils/flow';

/**
 * TC_IMI_SUBINDICES_E2E_01 — one test per step, run in order on ONE shared page (`flowPage`).
 * Each step logs what it saw via `stepLog.actual()`; the step reporter prints it next to the
 * Expected result from the test case file. Steps call `ensureAt()` so a failure doesn't
 * break the steps after it.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@e2e', '@subindices'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  const services = subindex('Services Sector Activity Index');

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
    await ensureAt(page, subindices.path, stepLog);
    const homeIcon = list.breadcrumbHome.locator('img');
    const text = await list.breadcrumbText();
    stepLog.actual(`Home icon: ${await homeIcon.isVisible() ? 'shown' : 'missing'} (links to ${await list.breadcrumbHome.getAttribute('href')}); text: "${text}"`);

    await expect.soft(homeIcon, 'Home icon').toBeVisible();
    expect.soft(await list.breadcrumbHome.getAttribute('href'), 'Home icon link').toBe('/');
    expect(text, 'Breadcrumb text').toBe(subindices.heading);
  });

  test(tc(6).title, tc(6).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    const heading = (await list.heading.innerText()).trim();
    stepLog.actual(`Heading: "${heading}"`);
    expect(heading).toBe(subindices.heading);
  });

  test(tc(7).title, tc(7).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    const subtitle = (await list.subtitle.innerText()).trim();
    stepLog.actual(`Subtitle: "${subtitle}"`);
    expect(subtitle).toBe(subindices.subtitle);
  });

  test(tc(8).title, tc(8).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.waitForLoaded();
    const count = await list.cardRoots.count();
    stepLog.actual(`Cards shown: ${count}`);
    expect(count).toBe(subindices.cardCount);
  });

  test(tc(9).title, tc(9).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.waitForLoaded();
    const on = await list.chartsOn();
    const missing: string[] = [];
    for (const card of await list.cards()) {
      const title = await card.titleText();
      const chart = await card.chartRoot.isVisible();
      const badge = await card.badge.isVisible();
      if (!chart || !badge) missing.push(`${title} (chart ${chart}, badge ${badge})`);
    }
    stepLog.actual(`Toggle: ${on ? 'ON' : 'OFF'}`);
    stepLog.actual(`Cards without chart or badge: ${missing.length ? missing.join('; ') : 'none'}`);

    expect.soft(on, 'Toggle ON by default').toBe(true);
    expect(missing, 'Cards missing chart or badge').toEqual([]);
  });

  test(tc(10).title, tc(10).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    // Precondition: toggle ON (it is unless the previous step failed on a fresh page).
    if (await ensureAt(page, subindices.path, stepLog)) await list.setCharts(true);
    await list.clickChartsToggle();
    await expect(list.charts).toHaveCount(0);
    const on = await list.chartsOn();
    const charts = await list.charts.count();
    const badges = await list.badges.count();
    stepLog.actual(`Toggle: ${on ? 'ON' : 'OFF'}; charts shown: ${charts}; badges shown: ${badges}`);

    expect.soft(on, 'Toggle OFF').toBe(false);
    expect.soft(charts, 'Charts hidden').toBe(0);
    expect(badges, 'Badges hidden').toBe(0);
  });

  test(tc(11).title, tc(11).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.setCharts(false);
    const problems: string[] = [];
    for (const card of await list.cards()) {
      const title = await card.titleText();
      const missing = [
        ['icon', await card.icon.isVisible()],
        ['title', await card.title.isVisible()],
        ['Near-term Outlook', await card.outlookHeading.isVisible()],
        ['sentiment icon', await card.sentimentIcon.isVisible()],
        ['outlook text', (await card.outlook()).length > 0],
        ['Know more', await card.knowMore.isVisible()],
      ].filter(([, ok]) => !ok).map(([name]) => name);
      stepLog.actual(`${title}: ${missing.length ? `missing ${missing.join(', ')}` : 'all fields shown'} (sentiment "${await card.sentimentIcon.getAttribute('alt')}")`);
      if (missing.length) problems.push(`${title}: ${missing.join(', ')}`);
    }
    expect(problems).toEqual([]);
  });

  test(tc(12).title, tc(12).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.setCharts(false);
    await list.clickChartsToggle();
    await expect(list.charts).toHaveCount(subindices.cardCount);
    const on = await list.chartsOn();
    const charts = await list.charts.count();
    stepLog.actual(`Toggle: ${on ? 'ON' : 'OFF'}; charts shown: ${charts}`);

    expect.soft(on, 'Toggle ON').toBe(true);
    expect(charts, 'Charts shown').toBe(subindices.cardCount);
  });

  test(tc(13).title, tc(13).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.card(services.title).knowMore.click();
    await page.waitForURL(`**${subindexPath(services.slug)}`);
    await detail.waitForLoaded();
    const heading = (await detail.heading.innerText()).trim();
    stepLog.actual(`URL: ${page.url()}; heading "${heading}"`);
    expect(heading).toBe(services.title);
  });

  test(tc(14).title, tc(14).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindexPath(services.slug), stepLog, { from: subindices.path });
    await page.goBack();
    await list.waitForLoaded();
    stepLog.actual(`After Back: ${page.url()}; heading "${await list.heading.innerText()}"`);
    expect(new URL(page.url()).pathname).toBe(subindices.path);
  });

  test(tc(15).title, tc(15).details, async ({ flowPage: page, flowSubindicesPage: list, flowHomePage: home, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.breadcrumbHome.click();
    await page.waitForURL((url) => url.pathname === '/');
    await home.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; title "${await page.title()}"`);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test(tc(16).title, tc(16).details, async ({ flowPage: page, flowHomePage: home, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, '/', stepLog);
    await home.header.navigate('India Macroeconomic Indices', 'Subindices');
    await page.waitForURL(/\/subindices$/);
    await list.waitForLoaded();
    const count = await list.cardRoots.count();
    const on = await list.chartsOn();
    stepLog.actual(`URL: ${page.url()}; cards: ${count}; toggle ${on ? 'ON' : 'OFF'}`);

    expect.soft(count, 'Cards').toBe(subindices.cardCount);
    expect(on, 'Toggle ON').toBe(true);
  });

  test(tc(17).title, tc(17).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.waitForLoaded();
    const titles = await list.cardTitles();
    stepLog.actual(`Titles in order: ${titles.join('; ')}`);
    expect(titles).toEqual(subindexList.map((s) => s.title));
  });

  subindexList.forEach(({ title, slug }, i) => {
    const n = cardFieldsStart + i;
    test(tc(n).title, tc(n).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
      if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
      const card = list.card(title);
      await card.root.scrollIntoViewIfNeeded();
      const value = await card.badgeText();
      const number = Number(value);
      const outlook = await card.outlook();
      const href = await card.knowMoreHref();
      const fields: [string, boolean][] = [
        ['icon', await card.icon.isVisible()],
        ['title', await card.title.isVisible()],
        ['chart', await card.chartRoot.isVisible()],
        ['Index Value', subindices.badgeFormat.test(value) && number >= 0 && number <= 100],
        ['Near-term Outlook heading', await card.outlookHeading.isVisible()],
        ['sentiment icon', await card.sentimentIcon.isVisible()],
        ['outlook text', outlook.length > 0],
        ['Know more link', href === subindexPath(slug)],
      ];
      const missing = fields.filter(([, ok]) => !ok).map(([name]) => name);
      stepLog.actual(`Index Value: "${value}"; sentiment: "${await card.sentimentIcon.getAttribute('alt')}"; Know more → ${href}`);
      stepLog.actual(`Outlook: "${outlook}"`);
      stepLog.actual(missing.length ? `Missing or wrong: ${missing.join(', ')}` : 'All fields shown and valid');
      expect(missing).toEqual([]);
    });
  });

  test(tc(26).title, tc(26).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    const mismatched: string[] = [];
    for (const card of await list.cards()) {
      const title = await card.titleText();
      const titleHref = await card.titleLink.getAttribute('href');
      const knowMoreHref = await card.knowMoreHref();
      stepLog.actual(`${title}: title → ${titleHref}; Know more → ${knowMoreHref}`);
      if (!titleHref || titleHref !== knowMoreHref) mismatched.push(title);
    }
    expect(mismatched).toEqual([]);
  });

  test(tc(27).title, tc(27).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await ensureAt(page, subindices.path, stepLog)) await list.waitForLoaded();
    await list.setCharts(true);
    const problems: string[] = [];
    for (const card of await list.cards()) {
      const title = await card.titleText();
      const text = await card.root.innerText();
      const badge = await card.badgeText();
      const bad = subindices.invalidValues.filter((v) => new RegExp(`\\b${v}\\b`).test(text));
      if (!badge) bad.push('empty Index Value');
      if (bad.length) problems.push(`${title}: ${bad.join(', ')}`);
    }
    stepLog.actual(`Cards checked: ${await list.cardRoots.count()}; invalid values: ${problems.length ? problems.join('; ') : 'none'}`);
    expect(problems).toEqual([]);
  });
});
