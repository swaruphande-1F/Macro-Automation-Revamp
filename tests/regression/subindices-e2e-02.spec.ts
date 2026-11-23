import type { Locator, Page } from '@playwright/test';
import { test, expect, type FlowMonitor, type StepLog } from '@fixtures';
import { cardBlock, cardBlockStart, hoverStart, tc, testCase } from '@data/tc-imi-subindices-e2e-02';
import { subindex, subindexDetail, subindexList, subindexPath, subindices, type RangeButton, type Subindex } from '@data/subindices';
import type { SubindexDetailPage, SubindicesPage } from '@pages';
import { lastNumberIn } from '@components/HighchartComponent';
import { ensureAt, openingSteps } from '@utils/flow';

/**
 * TC_IMI_SUBINDICES_E2E_02 — one test per step on ONE shared page (`flowPage`); see
 * subindices-e2e-01.spec.ts for how the flow and the step report work.
 * Values a later step compares against (card Index Value, outlook text, events on page 1)
 * are kept in `flowMonitor.state`. If a failure restarted the worker they are read again.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@e2e', '@subindices'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  const services = subindex('Services Sector Activity Index');
  const cpi = subindex('Consumer Inflation Index');
  const servicesPath = subindexPath(services.slug);
  const normalise = (s: string) => s.replace(/\s+/g, ' ').trim();

  /** Reads a card value stored by an earlier step; re-reads it from /subindices if the worker restarted. */
  async function stored(key: 'value' | 'outlook', s: Subindex, page: Page, list: SubindicesPage, monitor: FlowMonitor, log: StepLog): Promise<string> {
    const k = `card:${s.slug}:${key}`;
    if (typeof monitor.state[k] !== 'string') {
      const back = page.url();
      await page.goto(subindices.path);
      await list.waitForLoaded();
      const card = list.card(s.title);
      monitor.state[k] = key === 'value' ? await card.badgeText() : await card.outlook();
      await page.goto(back);
      log.actual(`(Card ${key} was not stored — read it again from /subindices)`);
    }
    return monitor.state[k] as string;
  }

  /** Opens `path` if the flow is elsewhere, then waits for the page to be ready. */
  async function onList(page: Page, list: SubindicesPage, log: StepLog): Promise<boolean> {
    const moved = await ensureAt(page, subindices.path, log);
    await list.waitForLoaded();
    return moved;
  }

  async function onDetail(page: Page, detail: SubindexDetailPage, slug: string, log: StepLog): Promise<void> {
    await ensureAt(page, subindexPath(slug), log, { from: subindices.path });
    await detail.waitForLoaded();
  }

  /** "Nov '25" → 1 Nov 2025; "2017" → 1 Jan 2017. */
  function axisDate(label: string): Date {
    const m = label.match(/^([A-Z][a-z]{2}) '(\d{2})$/);
    if (m) return new Date(2000 + Number(m[2]), 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(m[1]) / 3, 1);
    return new Date(Number(label), 0, 1);
  }

  const monthsAgo = (d: Date, now = new Date()) => (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();

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

  // ── Steps 5–108: each card → its detail page → back (13 steps per card) ──
  subindexList.forEach((s, i) => {
    const n = (step: (typeof cardBlock)[number]) => cardBlockStart + i * cardBlock.length + cardBlock.indexOf(step);
    const path = subindexPath(s.slug);

    test(tc(n('scroll')).title, tc(n('scroll')).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
      if (await onList(page, list, stepLog)) await list.setCharts(true);
      const card = list.card(s.title);
      await card.root.scrollIntoViewIfNeeded();
      const parts: [string, boolean][] = [
        ['card', await card.root.isVisible()],
        ['icon', await card.icon.isVisible()],
        ['title', await card.title.isVisible()],
        ['chart', await card.chartRoot.isVisible()],
        ['Index Value badge', await card.badge.isVisible()],
      ];
      const missing = parts.filter(([, ok]) => !ok).map(([name]) => name);
      stepLog.actual(missing.length ? `Missing: ${missing.join(', ')}` : 'Card visible with icon, title, chart and Index Value badge');
      expect(missing).toEqual([]);
    });

    test(tc(n('readValue')).title, tc(n('readValue')).details, async ({ flowPage: page, flowSubindicesPage: list, flowMonitor, stepLog }) => {
      if (await onList(page, list, stepLog)) await list.setCharts(true);
      const value = await list.card(s.title).badgeText();
      flowMonitor.state[`card:${s.slug}:value`] = value;
      stepLog.actual(`Card Index Value: "${value}" (stored)`);
      expect(value).toMatch(subindices.badgeFormat);
    });

    test(tc(n('readOutlook')).title, tc(n('readOutlook')).details, async ({ flowPage: page, flowSubindicesPage: list, flowMonitor, stepLog }) => {
      await onList(page, list, stepLog);
      const outlook = await list.card(s.title).outlook();
      flowMonitor.state[`card:${s.slug}:outlook`] = outlook;
      stepLog.actual(`Card outlook (stored): "${outlook}"`);
      expect(outlook.length, 'Outlook text length').toBeGreaterThan(0);
    });

    test(tc(n('knowMore')).title, tc(n('knowMore')).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
      await onList(page, list, stepLog);
      await list.card(s.title).knowMore.click();
      await page.waitForURL(`**${path}`);
      await detail.waitForLoaded();
      stepLog.actual(`URL: ${page.url()}; heading "${(await detail.heading.innerText()).trim()}"`);
      expect(new URL(page.url()).pathname).toBe(path);
    });

    test(tc(n('tabTitle')).title, tc(n('tabTitle')).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const title = await page.title();
      stepLog.actual(`Tab title: "${title}"`);
      expect(title).toBe(`${s.title}${subindexDetail.titleSuffix}`);
    });

    test(tc(n('heading')).title, tc(n('heading')).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const heading = (await detail.heading.innerText()).trim();
      stepLog.actual(`Heading: "${heading}"`);
      expect(heading).toBe(s.title);
    });

    test(tc(n('tabs')).title, tc(n('tabs')).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const tabs = await detail.tabNames();
      stepLog.actual(`Tabs: ${tabs.join(', ')}`);
      expect(tabs).toEqual(subindexDetail.tabs);
    });

    test(tc(n('phasePanel')).title, tc(n('phasePanel')).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const read = async (l: Locator) => ((await l.isVisible()) ? normalise(await l.innerText()) : '');
      const panel = {
        'Current Phase': await read(detail.phaseName),
        'Index Value': await read(detail.phaseIndexValue),
        'Success rate': await read(detail.successRate),
        Summary: await read(detail.summary),
      };
      for (const [k, v] of Object.entries(panel)) stepLog.actual(`${k}: ${v ? `"${v}"` : '(missing)'}`);
      expect(Object.entries(panel).filter(([, v]) => !v).map(([k]) => k), 'Missing fields').toEqual([]);
    });

    test(tc(n('compareValue')).title, tc(n('compareValue')).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, flowMonitor, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const card = await stored('value', s, page, list, flowMonitor, stepLog);
      await detail.waitForLoaded();
      const value = await detail.indexValue();
      stepLog.actual(`Detail Index Value: ${value} → rounded ${value.toFixed(1)}; card value: ${card}`);
      expect(value.toFixed(1)).toBe(card);
    });

    test(tc(n('overviewTab')).title, tc(n('overviewTab')).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      await detail.tab('Overview').click();
      const overview = page.getByRole('heading', { name: 'Overview', level: 2 });
      await expect.poll(() => detail.isScrolledTo(overview), { message: 'Scrolled to Overview' }).toBe(true);
      const recent = await detail.recentUpdates.isVisible();
      const nearTerm = await detail.nearTermOutlook.isVisible();
      stepLog.actual(`Scrolled to Overview; Recent Updates: ${recent ? 'shown' : 'missing'}; Near-term Outlook: ${nearTerm ? 'shown' : 'missing'}`);
      expect.soft(recent, 'Recent Updates').toBe(true);
      expect(nearTerm, 'Near-term Outlook').toBe(true);
    });

    test(tc(n('compareOutlook')).title, tc(n('compareOutlook')).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, flowMonitor, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const card = await stored('outlook', s, page, list, flowMonitor, stepLog);
      await detail.waitForLoaded();
      const first = normalise(await detail.nearTermPoints.first().innerText());
      stepLog.actual(`Card outlook: "${card}"`);
      stepLog.actual(`Detail Near-term Outlook, first point: "${first}"`);
      expect(normalise(card)).toBe(first);
    });

    test(tc(n('lastUpdated')).title, tc(n('lastUpdated')).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      const date = await detail.lastUpdatedDate();
      const source = await detail.sourceText();
      stepLog.actual(`Last Updated: "${date}"; Source: "${source}"`);
      expect.soft(date, 'Last Updated format').toMatch(subindexDetail.lastUpdated);
      expect(source.length, 'Source length').toBeGreaterThan(0);
    });

    test(tc(n('back')).title, tc(n('back')).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, s.slug, stepLog);
      await page.goBack();
      await list.waitForLoaded();
      const count = await list.cardRoots.count();
      const on = await list.chartsOn();
      stepLog.actual(`After Back: ${page.url()}; cards: ${count}; toggle ${on ? 'ON' : 'OFF'}`);
      expect.soft(new URL(page.url()).pathname, 'URL').toBe(subindices.path);
      expect.soft(count, 'Cards').toBe(subindices.cardCount);
      expect(on, 'Toggle ON').toBe(true);
    });
  });

  // ── Steps 109–124: Services Sector Activity Index detail page features ──
  test(tc(109).title, tc(109).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    await onList(page, list, stepLog);
    await list.card(services.title).knowMore.click();
    await page.waitForURL(`**${servicesPath}`);
    await detail.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; heading "${(await detail.heading.innerText()).trim()}"`);
    expect(new URL(page.url()).pathname).toBe(servicesPath);
  });

  test(tc(110).title, tc(110).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    const active = await detail.isOptionActive(subindexDetail.indexOption);
    const legends = await detail.legends();
    stepLog.actual(`"${subindexDetail.indexOption}" selected: ${active}; legend: ${legends.join(', ')}`);
    expect.soft(active, 'Index view selected').toBe(true);
    expect(legends).toEqual([subindexDetail.indexLegend]);
  });

  test(tc(111).title, tc(111).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    const { option, legend } = subindexDetail.comparison[services.slug];
    await detail.chartOption(option).click();
    await expect.poll(() => detail.legends(), { message: 'Legend shows both series' }).toEqual([subindexDetail.indexLegend, legend]);
    stepLog.actual(`Clicked "${option}"; selected: ${await detail.isOptionActive(option)}; legend: ${(await detail.legends()).join(', ')}`);
    expect(await detail.isOptionActive(option), 'Option selected').toBe(true);
  });

  test(tc(112).title, tc(112).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.chartOption(subindexDetail.indexOption).click();
    await expect.poll(() => detail.legends(), { message: 'Index-only legend' }).toEqual([subindexDetail.indexLegend]);
    stepLog.actual(`Clicked "${subindexDetail.indexOption}"; selected: ${await detail.isOptionActive(subindexDetail.indexOption)}; legend: ${(await detail.legends()).join(', ')}`);
    expect(await detail.isOptionActive(subindexDetail.indexOption)).toBe(true);
  });

  const rangeSteps: [number, RangeButton][] = [[113, '1Y'], [114, '5Y'], [115, '10Y'], [116, 'MAX']];
  for (const [n, range] of rangeSteps) {
    test(tc(n).title, tc(n).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
      await onDetail(page, detail, services.slug, stepLog);
      await detail.chartOption(range).click();
      await expect.poll(() => detail.isOptionActive(range), { message: `${range} active` }).toBe(true);
      const expectedLabel = `Range: ${subindexDetail.ranges[range]}`;
      await expect.soft(detail.rangeLabel, 'Range label').toContainText(expectedLabel);
      const labels = await detail.chart.xLabels();
      const first = axisDate(labels[0]);
      const label = normalise((await detail.rangeLabel.textContent()) ?? '');
      stepLog.actual(`${range} active; label "${label}"; x-axis: ${labels.join(', ')}`);
      stepLog.actual(`First x-axis label is ${monthsAgo(first)} months ago`);

      // Labels are tick marks, so the first one can sit a little inside the range.
      if (range === '1Y') expect(monthsAgo(first), 'First label within the last year').toBeLessThanOrEqual(12);
      if (range === '5Y') expect(monthsAgo(first), 'First label within the last 5 years').toBeLessThanOrEqual(60);
      if (range === '5Y') expect(monthsAgo(first), 'First label over 4 years back').toBeGreaterThan(48);
      if (range === 'MAX') expect(monthsAgo(first), 'Full history: first label over 10 years back').toBeGreaterThan(120);
      expect(label).toContain(expectedLabel);
    });
  }

  test(tc(117).title, tc(117).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    const tooltip = await detail.chart.hoverLastPoint();
    const value = lastNumberIn(tooltip);
    const phase = await detail.indexValue();
    stepLog.actual(`Tooltip: "${tooltip}"`);
    stepLog.actual(`Current Phase Index Value: ${phase}; Last Updated: ${await detail.lastUpdatedDate()}`);
    expect(value, 'Tooltip value').toBe(phase);
  });

  test(tc(118).title, tc(118).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.interpretationLink.click();
    await expect(detail.interpretationModal).toBeVisible();
    const text = normalise(await detail.interpretationModal.innerText());
    const found = subindexDetail.interpretation.filter((p) => text.includes(p));
    stepLog.actual(`Interpretation shown: "${text.slice(0, 200)}…"`);
    stepLog.actual(`Phase bands found: ${found.join('; ')}`);
    await detail.closeInterpretation();
    expect(found).toEqual(subindexDetail.interpretation);
  });

  test(tc(119).title, tc(119).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.tab('Description').click();
    const what = page.getByRole('heading', { name: `What is the ${services.title}?`, level: 3 });
    await expect.poll(() => detail.isScrolledTo(what), { message: 'Scrolled to Description' }).toBe(true);
    const components = await page.getByRole('heading', { name: 'What are its components?', level: 3 }).isVisible();
    const hfis = (await detail.highFrequencyIndicators.allInnerTexts()).map(normalise);
    stepLog.actual(`Scrolled to "What is the ${services.title}?"; "What are its components?": ${components ? 'shown' : 'missing'}`);
    stepLog.actual(`High Frequency Indicators (${hfis.length}): ${hfis.join(', ')}`);
    expect.soft(components, 'What are its components?').toBe(true);
    expect(hfis.length, 'High Frequency Indicators').toBeGreaterThan(0);
  });

  test(tc(120).title, tc(120).details, async ({ flowPage: page, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.tab('Usability').click();
    const heading = page.getByRole('heading', { name: 'Usability', level: 2 });
    await expect.poll(() => detail.isScrolledTo(heading), { message: 'Scrolled to Usability' }).toBe(true);
    stepLog.actual(`Scrolled to Usability; first line: "${normalise(await detail.section('usability').locator('h3').first().innerText())}"`);
  });

  test(tc(121).title, tc(121).details, async ({ flowPage: page, flowSubindexDetailPage: detail, flowMonitor, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.tab('Historical Events').click();
    const heading = page.getByRole('heading', { name: 'Historical Events', level: 2 });
    await expect.poll(() => detail.isScrolledTo(heading), { message: 'Scrolled to Historical Events' }).toBe(true);
    const events = await detail.events();
    flowMonitor.state.eventsPage1 = events.map((e) => e.title);
    const incomplete = events.filter((e) => !e.month || !e.year || !e.title || !e.description).map((e) => e.title || '(no title)');
    const dates = events.map((e) => axisDate(`${e.month} '${e.year.slice(2)}`).getTime());
    const ordered = dates.every((d, i) => i === 0 || d <= dates[i - 1]);
    for (const e of events) stepLog.actual(`${e.month} ${e.year} — ${e.title}`);
    stepLog.actual(`Newest first: ${ordered}; events missing a field: ${incomplete.length ? incomplete.join(', ') : 'none'}`);
    expect.soft(incomplete, 'Events missing month, year, title or description').toEqual([]);
    expect(ordered, 'Reverse chronological order').toBe(true);
  });

  test(tc(122).title, tc(122).details, async ({ flowPage: page, flowSubindexDetailPage: detail, flowMonitor, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    const page1 = await detail.events();
    flowMonitor.state.eventsPage1 = page1.map((e) => e.title);
    await detail.eventsPage(2).click();
    await expect.poll(() => detail.isEventsPageActive(2), { message: 'Page 2 active' }).toBe(true);
    await expect.poll(async () => (await detail.events())[0]?.title, { message: 'Events changed' }).not.toBe(page1[0]?.title);
    const page2 = await detail.events();
    const when = (e: { month: string; year: string }) => axisDate(`${e.month} '${e.year.slice(2)}`).getTime();
    const older = when(page2[0]) <= when(page1[page1.length - 1]);
    const overlap = page2.filter((e) => page1.some((p) => p.title === e.title)).map((e) => e.title);
    for (const e of page2) stepLog.actual(`${e.month} ${e.year} — ${e.title}`);
    stepLog.actual(`Page 2 active; older than page 1: ${older}; repeated from page 1: ${overlap.length ? overlap.join(', ') : 'none'}`);
    expect.soft(overlap, 'Events repeated from page 1').toEqual([]);
    expect(older, 'Page 2 events are older').toBe(true);
  });

  test(tc(123).title, tc(123).details, async ({ flowPage: page, flowSubindexDetailPage: detail, flowMonitor, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.eventsPage(1).click();
    await expect.poll(() => detail.isEventsPageActive(1), { message: 'Page 1 active' }).toBe(true);
    const titles = (await detail.events()).map((e) => e.title);
    stepLog.actual(`Page 1 active; events: ${titles.join('; ')}`);
    if (!flowMonitor.state.eventsPage1) stepLog.actual('(Page 1 events were not stored — compared with what page 1 shows now)');
    expect(titles).toEqual(flowMonitor.state.eventsPage1 ?? titles);
  });

  test(tc(124).title, tc(124).details, async ({ flowPage: page, flowSubindexDetailPage: detail, flowSubindicesPage: list, stepLog }) => {
    await onDetail(page, detail, services.slug, stepLog);
    await detail.breadcrumbSubindices.click();
    await page.waitForURL(/\/subindices$/);
    await list.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; heading "${await list.heading.innerText()}"`);
    expect(new URL(page.url()).pathname).toBe(subindices.path);
  });

  // ── Steps 125–132: Show charts toggle ──
  test(tc(125).title, tc(125).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await onList(page, list, stepLog);
    const on = await list.chartsOn();
    const charts = await list.charts.count();
    stepLog.actual(`Toggle ${on ? 'ON' : 'OFF'}; charts shown: ${charts}`);
    expect.soft(on, 'Toggle ON').toBe(true);
    expect(charts, 'Charts shown').toBe(subindices.cardCount);
  });

  test(tc(126).title, tc(126).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(true);
    await list.clickChartsToggle();
    await expect(list.charts).toHaveCount(0);
    const on = await list.chartsOn();
    stepLog.actual(`Toggle ${on ? 'ON' : 'OFF'}; charts shown: ${await list.charts.count()}`);
    expect(on, 'Toggle OFF').toBe(false);
  });

  test(tc(127).title, tc(127).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(false);
    await list.card(cpi.title).knowMore.click();
    await page.waitForURL(`**${subindexPath(cpi.slug)}`);
    await detail.waitForLoaded();
    stepLog.actual(`URL: ${page.url()}; heading "${(await detail.heading.innerText()).trim()}"`);
    expect(new URL(page.url()).pathname).toBe(subindexPath(cpi.slug));
  });

  test(tc(128).title, tc(128).details, async ({ flowPage: page, flowSubindicesPage: list, flowSubindexDetailPage: detail, stepLog }) => {
    await onDetail(page, detail, cpi.slug, stepLog);
    await page.goBack();
    await list.waitForLoaded();
    const on = await list.chartsOn();
    const charts = await list.charts.count();
    stepLog.actual(`After Back: ${page.url()}; toggle ${on ? 'ON (reset to default)' : 'OFF (kept)'}; charts shown: ${charts}`);
    stepLog.actual(`Expected product behaviour: toggle ${subindices.toggleOnAfterBack ? 'resets to ON' : 'stays OFF'} (src/data/subindices.ts)`);
    expect.soft(new URL(page.url()).pathname, 'URL').toBe(subindices.path);
    expect(on, 'Toggle state after Back').toBe(subindices.toggleOnAfterBack);
  });

  test(tc(129).title, tc(129).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await onList(page, list, stepLog);
    await page.reload();
    await list.waitForLoaded();
    await expect(list.charts).toHaveCount(subindices.cardCount);
    const on = await list.chartsOn();
    stepLog.actual(`After refresh: toggle ${on ? 'ON' : 'OFF'}; charts shown: ${await list.charts.count()}`);
    expect(on, 'Toggle ON').toBe(true);
  });

  test(tc(130).title, tc(130).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(true);
    for (let i = 0; i < subindices.rapidToggleClicks; i++) await list.chartsSwitch.click({ delay: 0 });
    await expect(list.charts).toHaveCount(subindices.cardCount);
    const on = await list.chartsOn();
    const perCard: string[] = [];
    for (const card of await list.cards()) perCard.push(`${await card.titleText()}: ${await card.chartRoot.count()}`);
    stepLog.actual(`After ${subindices.rapidToggleClicks} clicks: toggle ${on ? 'ON' : 'OFF'}`);
    stepLog.actual(`Charts per card — ${perCard.join('; ')}`);
    expect.soft(on, 'Toggle ON').toBe(true);
    expect(perCard.filter((p) => !p.endsWith(': 1')), 'Cards without exactly one chart').toEqual([]);
  });

  test(tc(131).title, tc(131).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(true);
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
    const focused = () => list.chartsToggle.evaluate((el) => el === document.activeElement);
    let presses = 0;
    while (!(await focused()) && presses < 100) {
      await page.keyboard.press('Tab');
      presses++;
    }
    const reached = await focused();
    stepLog.actual(reached ? `Toggle focused after ${presses} Tab presses` : `Toggle not focused after ${presses} Tab presses`);
    expect(reached, 'Toggle reachable with Tab').toBe(true);
    await page.keyboard.press('Space');
    await expect(list.charts).toHaveCount(0);
    const on = await list.chartsOn();
    stepLog.actual(`After Space: toggle ${on ? 'ON' : 'OFF'}; charts shown: ${await list.charts.count()}`);
    expect(on, 'Toggle OFF').toBe(false);
  });

  test(tc(132).title, tc(132).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(false);
    if (!(await list.chartsToggle.evaluate((el) => el === document.activeElement))) {
      await list.chartsToggle.focus();
      stepLog.actual('(Toggle was not focused — focused it before pressing Space)');
    }
    await page.keyboard.press('Space');
    await expect(list.charts).toHaveCount(subindices.cardCount);
    const on = await list.chartsOn();
    stepLog.actual(`After Space: toggle ${on ? 'ON' : 'OFF'}; charts shown: ${await list.charts.count()}`);
    expect(on, 'Toggle ON').toBe(true);
  });

  // ── Steps 133–143: charts on every card ──
  test(tc(133).title, tc(133).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, '/', stepLog);
    await list.header.navigate('India Macroeconomic Indices', 'Subindices');
    await page.waitForURL(/\/subindices$/);
    await list.waitForLoaded();
    const count = await list.cardRoots.count();
    const on = await list.chartsOn();
    stepLog.actual(`URL: ${page.url()}; cards: ${count}; toggle ${on ? 'ON' : 'OFF'}`);
    expect.soft(count, 'Cards').toBe(subindices.cardCount);
    expect(on, 'Toggle ON').toBe(true);
  });

  subindexList.forEach((s, i) => {
    const n = hoverStart + i;
    test(tc(n).title, tc(n).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
      if (await onList(page, list, stepLog)) await list.setCharts(true);
      const card = list.card(s.title);
      const tooltip = await card.chart.hoverLastPoint();
      const badge = await card.badgeText();
      stepLog.actual(`Tooltip: "${tooltip}"; badge: ${badge}`);
      expect(lastNumberIn(tooltip), 'Tooltip value').toBe(Number(badge));
    });
  });

  test(tc(142).title, tc(142).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(true);
    const problems: string[] = [];
    for (const card of await list.cards()) {
      const title = await card.titleText();
      const labels = await card.chart.xLabels();
      const bad = labels.filter((l) => !subindices.cardAxisLabel.test(l));
      stepLog.actual(`${title}: ${labels[0]} … ${labels.at(-1)} (${labels.join(', ')})`);
      if (labels.length < 2) problems.push(`${title}: fewer than 2 labels`);
      if (bad.length) problems.push(`${title}: ${bad.join(', ')}`);
    }
    expect(problems).toEqual([]);
  });

  test(tc(143).title, tc(143).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    if (await onList(page, list, stepLog)) await list.setCharts(true);
    const clipped: string[] = [];
    for (const card of await list.cards()) {
      const title = await card.titleText();
      await card.root.scrollIntoViewIfNeeded();
      const fit = await card.chart.plotFit();
      const y = await card.chart.yLabels();
      stepLog.actual(`${title}: y-axis ${y[0]}–${y.at(-1)}; line ${fit.line.top}–${fit.line.bottom}px inside plot ${fit.plot.top}–${fit.plot.bottom}px: ${!fit.clipped}`);
      if (fit.clipped) clipped.push(title);
    }
    expect(clipped, 'Charts with a clipped line').toEqual([]);
  });
});
