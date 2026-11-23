import { test, expect } from '@fixtures';
import { env } from '@config/env';
import { tc, testCase } from '@data/tc-imi-home-e2e-01';
import {
  announcements, assetAllocator, consoleNoise, correlation, footer, header, hero, homeTitle, indicatorCards,
  loadBudgetMs, macroIndex, maxAgeDays, mobileWidth, reports, thirdPartyNoise,
} from '@data/home';
import { daysSince, isFresh, parseSiteDate } from '@utils/helpers';

/**
 * TC_IMI_HOME_E2E_01 — one test per step, run in order on ONE shared page (`flowPage`)
 * so the end-to-end flow is never broken. Each test logs what it saw via `stepLog.actual()`;
 * the step reporter prints it next to the Expected result from the test case file.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@e2e'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  // In order, in one worker — overrides `fullyParallel` from the config.
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  /** Steps start on the homepage. After a failure Playwright opens a fresh page, so reopen it. */
  test.beforeEach(async ({ flowPage, flowHomePage }, testInfo) => {
    if (testInfo.title.startsWith('Step 01')) return;
    const url = new URL(flowPage.url() === 'about:blank' ? 'about:blank' : flowPage.url());
    if (url.origin !== new URL(env.baseURL).origin || url.pathname !== '/') await flowHomePage.open();
  });

  /** Clicks something that navigates, checks the URL, logs it and goes back to the homepage. */
  async function visitAndReturn(page: import('@playwright/test').Page, click: () => Promise<void>, url: RegExp, label: string, log: (l: string) => void) {
    await click();
    await page.waitForLoadState('domcontentloaded');
    log(`${label} → ${page.url()}`);
    await expect.soft(page, label).toHaveURL(url);
    await page.goBack();
    log(`Went back → ${page.url()}`);
  }

  test(tc(1).title, tc(1).details, async ({ flowPage: page, flowHomePage: home, flowMonitor, stepLog }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    await home.waitForLoaded();
    const status = response?.status();
    const title = await page.title();
    const errors = flowMonitor.consoleErrors.filter((e) => !consoleNoise.some((re) => re.test(e)));
    flowMonitor.state.loadTimings = await home.loadTimings();
    stepLog.actual(`HTTP status: ${status}`);
    stepLog.actual(`Title: "${title}"`);
    stepLog.actual(`Console errors: ${errors.length}${errors.length ? ` — ${errors.join(' | ')}` : ''}`);

    expect.soft(status, 'HTTP status').toBe(200);
    expect.soft(title, 'Page title').toBe(homeTitle);
    expect(errors, 'Console errors').toEqual([]);
  });

  test(tc(2).title, tc(2).details, async ({ flowHomePage: home, stepLog }) => {
    const logoHref = await home.header.logo.getAttribute('href');
    stepLog.actual(`Logo href: "${logoHref}"`);
    const shown: string[] = [];
    for (const name of header.menus) {
      if (await home.header.topLevel(name).isVisible()) shown.push(name);
    }
    stepLog.actual(`Menu items shown: ${shown.join(', ')}`);
    stepLog.actual('Note: "1 Finance Macroeconomic Index" and "Subindices" are inside the "India Macroeconomic Indices" dropdown, not top-level items.');

    expect.soft(logoHref, 'Logo href').toBe('/');
    expect(shown, 'Top-level menu items').toEqual([...header.menus]);
  });

  test(tc(3).title, tc(3).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    for (const { menu, item, url } of header.dropdowns) {
      await home.header.openMenu(menu);
      // The panel fades in over 300 ms; wait for the fade to finish before reading it.
      await expect.soft(home.header.dropdown(menu), `${menu} dropdown visible`).toHaveCSS('opacity', '1');
      const opacity = await home.header.dropdown(menu).evaluate((e) => getComputedStyle(e).opacity);
      const hrefs = await home.header.dropdown(menu).getByRole('link').evaluateAll((as) =>
        [...new Set(as.map((a) => (a as HTMLAnchorElement).href).filter((h) => !h.endsWith('#')))],
      );
      const broken: string[] = [];
      for (const href of hrefs) {
        const status = (await page.request.get(href)).status();
        if (status >= 400) broken.push(`${status} ${href}`);
      }
      stepLog.actual(`"${menu}": opened (opacity ${opacity}), ${hrefs.length} sub-links, ${broken.length} broken${broken.length ? ` — ${broken.join(', ')}` : ''}`);
      expect.soft(broken, `${menu} broken sub-links`).toEqual([]);

      // Re-hover: link checks or the popup handler may have moved the pointer off the menu.
      await home.header.openMenu(menu);
      await visitAndReturn(page, () => home.header.dropdownItem(menu, item).click(), url, `Clicked "${menu} › ${item}"`, stepLog.actual);
    }
  });

  test(tc(4).title, tc(4).details, async ({ flowHomePage: home, stepLog }) => {
    const bar = home.announcements;
    stepLog.actual(`First announcement on load: "${(await bar.link.textContent())?.trim()}"`);
    await bar.showAnnouncement(announcements.calendar.text);
    const text = (await bar.link.textContent())?.trim() ?? '';
    stepLog.actual(`Calendar announcement: "${text}"`);
    stepLog.actual(`"Live Now" tag present: ${text.includes(announcements.calendar.tag)}`);

    expect.soft(text).toContain(announcements.calendar.text);
    expect(text).toContain(announcements.calendar.tag);
  });

  test(tc(5).title, tc(5).details, async ({ flowHomePage: home, stepLog }) => {
    const bar = home.announcements;
    const first = (await bar.link.textContent()) ?? '';
    const height = (await bar.link.boundingBox())!.height;
    await bar.next.click();
    await expect.soft(bar.link).not.toHaveText(first);
    const afterNext = (await bar.link.textContent()) ?? '';
    const heightNext = (await bar.link.boundingBox())!.height;
    await bar.previous.click();
    await expect.soft(bar.link).toHaveText(first);
    const afterPrev = (await bar.link.textContent()) ?? '';
    const heightPrev = (await bar.link.boundingBox())!.height;
    stepLog.actual(`Start: "${first.trim()}" (height ${height}px)`);
    stepLog.actual(`After Next: "${afterNext.trim()}" (height ${heightNext}px)`);
    stepLog.actual(`After Previous: "${afterPrev.trim()}" (height ${heightPrev}px)`);

    expect.soft(afterNext, 'Next changes the announcement').not.toBe(first);
    expect.soft(afterPrev, 'Previous returns to the first one').toBe(first);
    expect(Math.abs(heightNext - height) + Math.abs(heightPrev - height), 'Bar height stays the same').toBeLessThan(10);
  });

  test(tc(6).title, tc(6).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await home.announcements.showAnnouncement(announcements.calendar.text);
    await visitAndReturn(page, () => home.announcements.link.click(), announcements.calendar.url, 'Clicked announcement', stepLog.actual);
  });

  test(tc(7).title, tc(7).details, async ({ flowHomePage: home, stepLog }) => {
    const heading = (await home.heroHeading.innerText()).trim();
    const subtext = (await home.heroSubtext.innerText()).trim();
    const buttons: string[] = [];
    for (const { name } of hero.buttons) if (await home.heroButton(name).isVisible()) buttons.push(name);
    stepLog.actual(`Heading: "${heading}"`);
    stepLog.actual(`Subtext: "${subtext}"`);
    stepLog.actual(`Buttons: ${buttons.join(', ')}`);

    expect.soft(heading).toBe(hero.heading);
    expect.soft(subtext).toBe(hero.subtext);
    expect(buttons).toEqual(hero.buttons.map((b) => b.name));
  });

  test(tc(8).title, tc(8).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const { name, url } = hero.buttons[0];
    await visitAndReturn(page, () => home.heroButton(name).click(), url, `Clicked "${name}"`, stepLog.actual);
  });

  test(tc(9).title, tc(9).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const { name, url } = hero.buttons[1];
    await visitAndReturn(page, () => home.heroButton(name).click(), url, `Clicked "${name}"`, stepLog.actual);
  });

  test(tc(10).title, tc(10).details, async ({ flowHomePage: home, stepLog }) => {
    for (const { name, frequency } of indicatorCards) {
      const text = (await home.cards.text(name)).replace(/\s*\n\s*/g, ' | ');
      const bad = /NaN|undefined|null/.test(text);
      stepLog.actual(`${name}: ${text}${bad ? '  ⚠ contains NaN/undefined/null' : ''}`);
      expect.soft(bad, `${name} has a blank/NaN/undefined field`).toBe(false);
      expect.soft(text, `${name} frequency`).toContain(frequency);
      expect.soft(text, `${name} last-updated label`).toContain('Last updated');
    }
  });

  test(tc(11).title, tc(11).details, async ({ flowHomePage: home, stepLog }) => {
    for (const { name, frequency, maxAgeDays: limit = maxAgeDays[frequency] } of indicatorCards) {
      const updated = await home.cards.lastUpdated(name);
      const age = daysSince(parseSiteDate(updated));
      const fresh = isFresh(parseSiteDate(updated), frequency, limit);
      stepLog.actual(`${name} (${frequency}): "${updated}" → ${age} days old, limit ${limit} → ${fresh ? 'fresh' : 'STALE'}`);
      expect.soft(fresh, `${name}: "${updated}" is ${age} days old (limit ${limit})`).toBe(true);
    }
  });

  test(tc(12).title, tc(12).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    for (const { name, url } of indicatorCards) {
      await visitAndReturn(page, () => home.cards.card(name).click(), url, `Clicked "${name}"`, stepLog.actual);
    }
  });

  test(tc(13).title, tc(13).details, async ({ flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    await mi.root.scrollIntoViewIfNeeded();
    const phase = (await mi.currentPhase.innerText()).trim();
    const value = (await mi.indexValue.innerText()).trim();
    const rate = (await mi.successRate.innerText()).trim();
    const summary = (await mi.summary.innerText()).trim();
    stepLog.actual(`Current phase: "${phase}"`);
    stepLog.actual(`${value}`);
    stepLog.actual(`Success rate: "${rate}"`);
    stepLog.actual(`Summary: "${summary.slice(0, 120)}${summary.length > 120 ? '…' : ''}"`);

    expect.soft(phase, 'Current phase').not.toBe('');
    expect.soft(value).toMatch(/^Index Value: \d+(\.\d+)?$/);
    expect.soft(rate).toMatch(/^\d+% Success rate$/);
    expect(summary, 'Summary').not.toBe('');
  });

  test(tc(14).title, tc(14).details, async ({ flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    await mi.interpretationLink.click();
    await expect.soft(mi.interpretationModal).toBeVisible();
    const opened = await mi.interpretationModal.isVisible();
    const text = opened ? (await mi.interpretationModal.innerText()).replace(/\s+/g, ' ').slice(0, 150) : '';
    stepLog.actual(`Interpretation modal opened: ${opened}${opened ? ` — "${text}…"` : ''}`);
    if (opened) {
      await mi.closeModal(mi.interpretationModal);
      await expect.soft(mi.interpretationModal).toBeHidden();
      stepLog.actual(`Closed by clicking outside: ${await mi.interpretationModal.isHidden()} (Escape does not close it)`);
    }
    expect(opened, 'Interpretation modal opened').toBe(true);
  });

  test(tc(15).title, tc(15).details, async ({ flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    await mi.chart.scrollIntoViewIfNeeded();
    for (const { tab, legend } of [...macroIndex.series].reverse()) {
      await mi.tab(tab).click();
      await expect.soft(mi.tabPill(tab)).toHaveClass(/bg-white/);
      await expect.soft(mi.chart).toContainText(legend);
      const chartText = (await mi.chart.textContent()) ?? '';
      const label = (await mi.showingLabel.textContent())?.trim();
      stepLog.actual(`"${tab}" tab → legend "${legend}" shown: ${chartText.includes(legend)}; label "${label}"`);
    }
  });

  test(tc(16).title, tc(16).details, async ({ flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    await mi.chart.scrollIntoViewIfNeeded();
    const axes = new Set<string>();
    for (const [tab, label] of Object.entries(macroIndex.ranges)) {
      await mi.tab(tab).click();
      await expect.soft(mi.showingLabel).toContainText(`Range: ${label}`);
      const axis = await mi.xAxisText();
      axes.add(axis);
      stepLog.actual(`${tab}: label "${(await mi.showingLabel.textContent())?.trim()}"; x-axis "${axis}"`);
    }
    expect(axes.size, 'Each range draws a different x-axis').toBe(Object.keys(macroIndex.ranges).length);
  });

  test(tc(17).title, tc(17).details, async ({ flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    await mi.hoverChart();
    const shown = await mi.tooltip.first().isVisible();
    const text = shown ? ((await mi.tooltip.first().textContent()) ?? '').replace(/\s+/g, ' ').trim() : '';
    stepLog.actual(`Tooltip shown: ${shown}${shown ? ` — "${text}"` : ''}`);

    expect.soft(shown, 'Tooltip visible').toBe(true);
    expect.soft(text, 'Tooltip has a date').toMatch(/\d{1,2} [A-Z][a-z]{2}, \d{4}/);
    expect(text, 'Tooltip has a value').toMatch(/\d+(\.\d+)?/);
  });

  test(tc(18).title, tc(18).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    // Reading the clipboard needs permission (Chromium only — this spec runs on Chromium).
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // 1. "How to Embed this Chart?" opens the tutorial-video guide.
    await mi.embedLink.click();
    await expect.soft(mi.embedModal).toBeVisible();
    const guideOpened = await mi.embedModal.isVisible();
    const video = guideOpened ? await mi.embedModal.locator('video').getAttribute('src') : null;
    stepLog.actual(`"How to Embed this Chart?" → guide modal opened: ${guideOpened}; video: ${video ?? 'not found'}`);
    if (guideOpened) await mi.closeModal(mi.embedModal);

    // 2. The embed code itself lives under the share icon → "Embed this chart".
    await mi.shareButton.click();
    await mi.shareMenuItem('Embed this chart').click();
    await expect.soft(mi.embedCodeModal).toBeVisible();
    const codeOpened = await mi.embedCodeModal.isVisible();
    stepLog.actual(`Share icon → "Embed this chart" → "Embed Chart" modal opened: ${codeOpened}`);

    // 3. The code is a valid <iframe> whose src page loads.
    const code = codeOpened ? ((await mi.embedCode.textContent()) ?? '').replace(/\s+/g, ' ').trim() : '';
    const src = code.match(macroIndex.embedCode)?.[1];
    const srcStatus = src ? (await page.request.get(src)).status() : undefined;
    stepLog.actual(`Embed code: ${code || '(none)'}`);
    stepLog.actual(`iframe src: ${src ?? 'not found'} → HTTP ${srcStatus ?? 'n/a'}`);

    // 4. The copy icon puts the same code on the clipboard and shows "Copied!".
    let clipboard = '';
    let copiedShown = false;
    if (codeOpened) {
      await page.evaluate(() => navigator.clipboard.writeText(''));
      await mi.embedCopyIcon.click();
      copiedShown = await mi.embedCodeModal.getByText('Copied!').waitFor({ timeout: 3_000 }).then(() => true, () => false);
      clipboard = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\s+/g, ' ').trim();
    }
    stepLog.actual(`Copy icon → "Copied!" shown: ${copiedShown}; clipboard matches code: ${clipboard !== '' && clipboard === code}`);

    // 5. The × closes the modal.
    if (codeOpened) {
      await mi.embedCodeClose.click();
      await expect.soft(mi.embedCodeModal).toBeHidden();
    }
    const closed = await mi.embedCodeModal.isHidden();
    stepLog.actual(`× clicked → modal closed: ${closed}`);

    expect.soft(guideOpened, 'How-to guide opens').toBe(true);
    expect.soft(code, 'Embed code is an <iframe> pointing at the site').toMatch(macroIndex.embedCode);
    expect.soft(srcStatus, 'iframe src loads').toBe(200);
    expect.soft(copiedShown, '"Copied!" confirmation').toBe(true);
    expect.soft(clipboard, 'Clipboard holds the embed code').toBe(code);
    expect(closed, 'Embed modal closes').toBe(true);
  });

  test(tc(19).title, tc(19).details, async ({ flowHomePage: home, stepLog }) => {
    const mi = home.macroIndex;
    const line = ((await mi.footerLine().textContent()) ?? '').replace(/\s+/g, ' ').trim();
    stepLog.actual(`Chart footer: "${line}"`);

    expect.soft(line).toMatch(/Last Updated: \d{1,2} [A-Z][a-z]{2}, \d{4}/);
    expect(line).toContain(macroIndex.source);
  });

  test(tc(20).title, tc(20).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    await visitAndReturn(page, () => home.macroIndex.headingLink.click(), macroIndex.url, 'Clicked heading link', stepLog.actual);
  });

  test(tc(21).title, tc(21).details, async ({ flowHomePage: home, stepLog }) => {
    await home.assetAllocator.currentPhase.scrollIntoViewIfNeeded();
    const allocatorPhase = await home.assetAllocator.phase();
    const macroPhase = (await home.macroIndex.currentPhase.innerText()).trim();
    stepLog.actual(`Asset Allocator phase: "${allocatorPhase}"`);
    stepLog.actual(`Macro Index phase: "${macroPhase}"`);

    expect(allocatorPhase).toBe(macroPhase);
  });

  test(tc(22).title, tc(22).details, async ({ flowHomePage: home, stepLog }) => {
    const aa = home.assetAllocator;
    const seen = new Set<string>();
    let previous = '';
    for (const age of assetAllocator.ageGroups) {
      await aa.ageButton(age).click();
      await expect.poll(async () => (await aa.percentages()).join(','), { message: `${age} updates the chart` }).not.toBe(previous);
      const pct = await aa.percentages();
      const legend = await aa.legend();
      const total = pct.reduce((a, b) => a + b, 0);
      const missing = assetAllocator.classes.filter((c) => !legend.includes(c));
      previous = pct.join(',');
      seen.add(previous);
      stepLog.actual(`${age}: ${assetAllocator.classes.map((c, i) => `${c} ${pct[i]}%`).join(', ')} → total ${total}%${missing.length ? `; missing ${missing.join(', ')}` : ''}`);

      expect.soft(pct, `${age} slices`).toHaveLength(assetAllocator.classes.length);
      expect.soft(missing, `${age} asset classes`).toEqual([]);
      expect.soft(Math.abs(total - 100), `${age} total ≈ 100%`).toBeLessThanOrEqual(1);
    }
    const note = await aa.roundingNote.isVisible();
    stepLog.actual(`Rounding note shown: ${note}`);
    expect.soft(seen.size, 'Each age group has its own allocation').toBe(assetAllocator.ageGroups.length);
    expect(note, 'Rounding note').toBe(true);
  });

  test(tc(23).title, tc(23).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    stepLog.actual(`Link href: ${await home.assetAllocator.knowMore.getAttribute('href')}`);
    await visitAndReturn(page, () => home.assetAllocator.knowMore.click(), assetAllocator.url, 'Clicked "Know more"', stepLog.actual);
  });

  test(tc(24).title, tc(24).details, async ({ flowHomePage: home, stepLog }) => {
    const aa = home.assetAllocator;
    await aa.correlationTable.scrollIntoViewIfNeeded();
    const headers = await aa.correlationHeaders();
    const rows = await aa.correlationRows();
    stepLog.actual(`Columns (${headers.length}): ${headers.join(', ')}`);
    rows.forEach((r) => stepLog.actual(`${r[0]}: ${r.slice(1).map((v) => v || '—').join('  ')}`));

    expect.soft(headers, 'Columns').toHaveLength(correlation.size);
    expect.soft(rows, 'Rows').toHaveLength(correlation.size);
    rows.forEach(([name, ...values], i) => {
      expect.soft(name, 'Row order matches column order').toBe(headers[i]);
      expect.soft(values[i], `${name} diagonal`).toBe('1.00');
      for (const v of values.filter(Boolean)) {
        expect.soft(Math.abs(Number(v)), `${name}: ${v} within −1…1`).toBeLessThanOrEqual(1);
      }
    });
  });

  test(tc(25).title, tc(25).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const href = await home.assetAllocator.correlationKnowMore.getAttribute('href');
    stepLog.actual(`Link href: ${href}${href?.includes('//knowledge-hub') ? '  ⚠ double slash in URL' : ''}`);
    await visitAndReturn(page, () => home.assetAllocator.correlationKnowMore.click(), correlation.url, 'Clicked "Know more"', stepLog.actual);
  });

  test(tc(26).title, tc(26).details, async ({ flowHomePage: home, stepLog }) => {
    const rr = home.reports;
    await rr.root.scrollIntoViewIfNeeded();
    for (const tab of reports.tabs) {
      await rr.tab(tab).click();
      await expect.soft(rr.cards.first()).toContainText(tab);
      const cards = await rr.cardData();
      const times = cards.map((c) => Date.parse(c.date));
      const sorted = times.every((t, i) => i === 0 || times[i - 1] >= t);
      const incomplete = cards.filter((c) => !c.title || c.category !== tab || !c.date || !/^\d+ min read$/.test(c.readTime));
      stepLog.actual(`${tab}: ${cards.length} cards, newest first: ${sorted}, incomplete: ${incomplete.length}`);
      cards.forEach((c) => stepLog.actual(`   • ${c.title} | ${c.category} | ${c.date} | ${c.readTime}`));

      expect.soft(cards.length, `${tab} cards`).toBeGreaterThan(0);
      expect.soft(incomplete.map((c) => c.href), `${tab} incomplete cards`).toEqual([]);
      expect.soft(sorted, `${tab} sorted newest first`).toBe(true);
    }
  });

  test(tc(27).title, tc(27).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const rr = home.reports;
    await rr.tab('Blogs').click();
    const [first] = await rr.cardData();
    await rr.cards.first().click();
    const h1 = (await page.getByRole('heading', { level: 1 }).innerText()).trim();
    stepLog.actual(`Card title: "${first.title}"`);
    stepLog.actual(`Opened ${page.url()} with heading "${h1}"`);
    await expect.soft(page).toHaveURL(new RegExp(`${first.href}$`));
    expect.soft(h1, 'Blog heading matches card title').toBe(first.title);
    await page.goBack();
    stepLog.actual(`Went back → ${page.url()}`);
  });

  test(tc(28).title, tc(28).details, async ({ flowHomePage: home, stepLog }) => {
    const ft = home.footer;
    await ft.root.scrollIntoViewIfNeeded();
    const text = (await ft.root.innerText()).replace(/\s+/g, ' ');
    const cin = text.match(footer.cin)?.[0];
    const sections = footer.sections.filter((s) => text.includes(s));
    stepLog.actual(`CIN: ${cin ?? 'not found'}`);
    stepLog.actual(`Sections found: ${sections.join(', ')}`);

    expect.soft(cin, 'CIN number').toBeTruthy();
    expect(sections).toEqual(footer.sections);
  });

  test(tc(29).title, tc(29).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const origin = new URL(page.url()).origin;
    const links = await home.footer.linkData();
    const problems: string[] = [];
    for (const { text, href, target } of links) {
      const status = (await page.request.get(href)).status();
      const external = !href.startsWith(origin);
      const newTab = target === '_blank';
      stepLog.actual(`${text} → ${status}${external ? `, external, opens in new tab: ${newTab}` : ''}`);
      if (status >= 400) problems.push(`${text} returned ${status}`);
      if (external && !newTab) problems.push(`${text} does not open in a new tab`);
    }
    stepLog.actual(`${links.length} links checked, ${problems.length} problems`);
    expect(problems).toEqual([]);
  });

  test(tc(30).title, tc(30).details, async ({ flowHomePage: home, stepLog }) => {
    const ft = home.footer;
    await ft.subscribe(footer.invalidEmail);
    await expect.soft(ft.emailError).toBeVisible();
    const error = (await ft.emailError.isVisible()) ? (await ft.emailError.innerText()).trim() : '(no error shown)';
    stepLog.actual(`Entered "${footer.invalidEmail}" → error: "${error}"`);
    expect(error).toBe(footer.invalidEmailError);
  });

  test(tc(31).title, tc(31).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const ft = home.footer;
    // Mocked so production never gets a test subscriber. The site shows success only on 201.
    await page.route(footer.subscribeApi, (route) => route.fulfill({ status: 201, contentType: 'application/json', body: '{}' }));
    const email = footer.testEmail();
    await ft.subscribe(email);
    // The site hides the message after 4s, so read it as soon as it appears.
    const shown = await ft.subscribeMessage.waitFor({ timeout: 3_000 }).then(() => true, () => false);
    const message = shown ? (await ft.subscribeMessage.innerText()).trim() : '(no message shown)';
    await page.unroute(footer.subscribeApi);
    stepLog.actual(`Entered "${email}" (API mocked) → message: "${message}"`);
    stepLog.actual(`Input cleared: ${(await ft.emailInput.inputValue()) === ''}; validation error: ${await ft.emailError.isVisible()}`);

    expect.soft(await ft.emailError.isVisible(), 'No validation error').toBe(false);
    expect(message, 'Success message').toBe(footer.subscribeSuccess);
  });

  test(tc(32).title, tc(32).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    for (const name of footer.appLinks) {
      const href = (await home.footer.appLink(name).getAttribute('href')) ?? '';
      // Follow the onelink redirect chain without opening the store.
      const res = await page.request.get(href, { maxRedirects: 10 }).catch(() => null);
      stepLog.actual(`${name}: href ${href} → resolves to ${res?.url() ?? 'n/a'} (${res?.status() ?? 'error'})`);
      expect.soft(href, `${name} link`).toMatch(footer.appLinkHost);
    }
  });

  test(tc(33).title, tc(33).details, async ({ flowHomePage: home, stepLog }) => {
    const text = ((await home.footer.copyright.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    const year = new Date().getFullYear();
    stepLog.actual(`Copyright line: "${text}" (current year ${year})`);

    expect.soft(text).toContain(`© Copyright ${year}`);
    expect(text).toContain('indiamacroindicators.co.in');
  });

  test(tc(34).title, tc(34).details, async ({ flowPage: page, flowHomePage: home, stepLog }) => {
    const desktop = page.viewportSize()!;
    await page.setViewportSize({ width: mobileWidth, height: 800 });
    try {
      await home.open();
      const sideScroll = await home.hasHorizontalScroll();
      stepLog.actual(`Viewport ${mobileWidth}px — horizontal scroll: ${sideScroll}`);

      const hamburgerShown = await home.header.hamburger.isVisible();
      await home.header.hamburger.click();
      const menuOpened = await page.getByRole('link', { name: '1 Finance Macroeconomic Index' }).filter({ visible: true }).first()
        .waitFor({ timeout: 5_000 }).then(() => true, () => false);
      stepLog.actual(`Hamburger shown: ${hamburgerShown}; menu opens on tap: ${menuOpened}`);
      await home.open();

      const overflowing: string[] = [];
      const columns = new Set<number>();
      for (const { name } of indicatorCards) {
        const box = (await home.cards.card(name).boundingBox())!;
        columns.add(Math.round(box.x));
        if (box.x + box.width > mobileWidth) overflowing.push(name);
      }
      stepLog.actual(`Indicator cards laid out in ${columns.size} column(s); overflowing the screen: ${overflowing.length ? overflowing.join(', ') : 'none'}`);

      expect.soft(sideScroll, 'Horizontal scroll').toBe(false);
      expect.soft(hamburgerShown, 'Hamburger visible').toBe(true);
      expect.soft(menuOpened, 'Hamburger opens the menu').toBe(true);
      expect(overflowing, 'Cards fit within the screen').toEqual([]);
    } finally {
      await page.setViewportSize(desktop);
      await home.open();
    }
  });

  test(tc(35).title, tc(35).details, async ({ flowPage: page, flowHomePage: home, flowMonitor, stepLog }) => {
    await home.footer.root.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle').catch(() => {});
    const errors = flowMonitor.consoleErrors.filter((e) => !consoleNoise.some((re) => re.test(e)));
    const failed = flowMonitor.failedRequests.filter((r) => !thirdPartyNoise.some((re) => re.test(r)));
    const timings = (flowMonitor.state.loadTimings as { domContentLoaded: number; load: number } | undefined) ?? await home.loadTimings();
    stepLog.actual(`Console errors across the run: ${errors.length}${errors.length ? ` — ${errors.slice(0, 5).join(' | ')}` : ''}`);
    stepLog.actual(`Failed requests (4xx/5xx) across the run: ${failed.length}${failed.length ? ` — ${failed.slice(0, 5).join(' | ')}` : ''}`);
    stepLog.actual(`Homepage load (step 1): DOMContentLoaded ${timings.domContentLoaded} ms, load ${timings.load} ms (budget ${loadBudgetMs} ms)`);

    expect.soft(errors, 'Console errors').toEqual([]);
    expect.soft(failed, 'Failed requests').toEqual([]);
    expect(timings.domContentLoaded, 'DOMContentLoaded within budget').toBeLessThan(loadBudgetMs);
  });
});
