import { test, expect } from '@fixtures';
import {
  announcements, assetAllocator, correlation, footer, header, hero, homeTitle, indicatorCards,
  consoleNoise, loadBudgetMs, macroIndex, maxAgeDays, mobileWidth, reports, thirdPartyNoise,
} from '@data/home';
import { daysSince, isFresh, parseSiteDate, trackConsoleErrors, trackFailedRequests } from '@utils/helpers';

test.describe('TC_IMI_HOME_E2E_01: Homepage E2E', {
  tag: ['@regression', '@e2e'],
  annotation: { type: 'testcase', description: 'TC_IMI_HOME_E2E_01' },
}, () => {
  test.describe('desktop', () => {
    test.beforeEach(async ({ homePage, isMobile }) => {
      test.skip(isMobile, 'Desktop layout; step 34 covers mobile');
      await homePage.open();
    });

    test('header and dropdown menus (steps 2–3)', async ({ homePage, page }) => {
      await test.step('2. Logo links home and the menu shows every top-level item', async () => {
        await expect(homePage.header.logo).toHaveAttribute('href', '/');
        for (const name of header.menus) {
          await expect(homePage.header.topLevel(name)).toBeVisible();
        }
      });

      for (const { menu, item, url } of header.dropdowns) {
        await test.step(`3. "${menu}" dropdown opens and its sub-links work`, async () => {
          await homePage.header.openMenu(menu);
          await expect(homePage.header.dropdown(menu)).toHaveCSS('opacity', '1');

          const hrefs = await homePage.header.dropdown(menu).getByRole('link').evaluateAll((as) =>
            [...new Set(as.map((a) => (a as HTMLAnchorElement).href).filter((h) => !h.endsWith('#')))],
          );
          expect(hrefs.length, `${menu} has sub-links`).toBeGreaterThan(0);
          for (const href of hrefs) {
            const res = await page.request.get(href);
            expect.soft(res.status(), href).toBeLessThan(400);
          }

          // Re-hover: the popup handler or the link checks above may have moved the pointer off the menu.
          await homePage.header.openMenu(menu);
          await homePage.header.dropdownItem(menu, item).click();
          await expect(page).toHaveURL(url);
          await page.goBack();
        });
      }
    });

    test('announcement bar (steps 4–6)', async ({ homePage, page }) => {
      const bar = homePage.announcements;

      await test.step('4. Economic Calendar announcement shows a "Live Now" tag', async () => {
        await bar.showAnnouncement(announcements.calendar.text);
        await expect(bar.link).toContainText(announcements.calendar.text);
        await expect(bar.link).toContainText(announcements.calendar.tag);
      });

      await test.step('5. Next/Previous cycle announcements without breaking the layout', async () => {
        const height = (await bar.link.boundingBox())!.height;
        const first = (await bar.link.textContent()) ?? '';
        await bar.next.click();
        await expect(bar.link).not.toHaveText(first);
        expect((await bar.link.boundingBox())!.height).toBeCloseTo(height, -1);
        await bar.previous.click();
        await expect(bar.link).toHaveText(first);
        expect((await bar.link.boundingBox())!.height).toBeCloseTo(height, -1);
      });

      await test.step('6. Announcement link opens the Economic Calendar', async () => {
        await bar.showAnnouncement(announcements.calendar.text);
        await bar.link.click();
        await expect(page).toHaveURL(announcements.calendar.url);
        await page.goBack();
      });
    });

    test('hero and buttons (steps 7–9)', async ({ homePage, page }) => {
      await test.step('7. Hero heading, subtext and two buttons', async () => {
        await expect(homePage.heroHeading).toHaveText(hero.heading);
        await expect(homePage.heroSubtext).toHaveText(hero.subtext);
        for (const { name } of hero.buttons) await expect(homePage.heroButton(name)).toBeVisible();
      });

      for (const [i, { name, url }] of hero.buttons.entries()) {
        await test.step(`${8 + i}. "${name}" opens its page`, async () => {
          await homePage.heroButton(name).click();
          await expect(page).toHaveURL(url);
          await page.goBack();
          await expect(homePage.heroHeading).toBeVisible();
        });
      }
    });

    test('indicator cards show fresh, complete data (steps 10–12)', async ({ homePage, page }) => {
      for (const { name, url, frequency, maxAgeDays: limit = maxAgeDays[frequency] } of indicatorCards) {
        await test.step(`10. ${name}: fields`, async () => {
          const text = await homePage.cards.text(name);
          expect(text).not.toMatch(/NaN|undefined|null/);
          expect(text).toContain(frequency);
        });

        await test.step(`11. ${name}: freshness`, async () => {
          const updated = await homePage.cards.lastUpdated(name);
          const date = parseSiteDate(updated);
          expect(isFresh(date, frequency, limit), `"${updated}" is ${daysSince(date)} days old (limit ${limit})`).toBe(true);
        });

        await test.step(`12. ${name}: opens its page`, async () => {
          await homePage.cards.card(name).click();
          await expect(page).toHaveURL(url);
          await page.goBack();
        });
      }
    });

    test('1 Finance Macroeconomic Index chart (steps 13–20)', async ({ homePage, page }) => {
      const mi = homePage.macroIndex;

      await test.step('13. Current phase, index value, success rate and summary', async () => {
        await mi.root.scrollIntoViewIfNeeded();
        await expect(mi.currentPhase).not.toBeEmpty();
        await expect(mi.indexValue).toHaveText(/^Index Value: \d+(\.\d+)?$/);
        await expect(mi.successRate).toHaveText(/^\d+% Success rate$/);
        await expect(mi.summary).not.toBeEmpty();
      });

      await test.step('14. More on Interpretation opens the interpretation modal', async () => {
        await mi.interpretationLink.click();
        await expect(mi.interpretationModal).toBeVisible();
        await mi.closeModal(mi.interpretationModal);
        await expect(mi.interpretationModal).toBeHidden();
      });

      await test.step('15. Series tabs redraw the chart with the matching legend', async () => {
        await expect(mi.chart).toBeVisible();
        for (const { tab, legend } of [...macroIndex.series].reverse()) {
          await mi.tab(tab).click();
          await expect(mi.tabPill(tab)).toHaveClass(/bg-white/);
          await expect(mi.chart).toContainText(legend);
          await expect(mi.showingLabel).toContainText(`Showing: ${tab}`);
        }
      });

      await test.step('16. Range tabs update the x-axis and the "Range" label', async () => {
        const axes = new Set<string>();
        for (const [tab, label] of Object.entries(macroIndex.ranges)) {
          await mi.tab(tab).click();
          await expect(mi.tabPill(tab)).toHaveClass(/bg-white/);
          await expect(mi.showingLabel).toContainText(`Range: ${label}`);
          axes.add(await mi.xAxisText());
        }
        expect(axes.size, 'each range draws a different x-axis').toBe(Object.keys(macroIndex.ranges).length);
      });

      await test.step('17. Hovering the chart shows a tooltip with date and value', async () => {
        await mi.hoverChart();
        await expect(mi.tooltip.first()).toContainText(/\d{1,2} [A-Z][a-z]{2}, \d{4}/);
        await expect(mi.tooltip.first()).toContainText(/\d/);
      });

      await test.step('18. "How to Embed this Chart?" opens the embed guide and closes', async () => {
        await mi.embedLink.click();
        await expect(mi.embedModal).toBeVisible();
        await expect(mi.embedModal.locator('video')).toHaveAttribute('src', /\.mp4$/);
        await mi.closeModal(mi.embedModal);
        await expect(mi.embedModal).toBeHidden();
      });

      await test.step('19. Chart footer shows Last Updated and the source', async () => {
        await expect(mi.lastUpdated).toHaveText(/^Last Updated: \d{1,2} [A-Z][a-z]{2}, \d{4}/);
        await expect(mi.footerLine()).toContainText(macroIndex.source);
      });

      await test.step('20. Heading link opens the Macroeconomic Index page', async () => {
        await mi.headingLink.click();
        await expect(page).toHaveURL(macroIndex.url);
        await page.goBack();
      });
    });

    test('Asset Allocator and Correlation (steps 21–25)', async ({ homePage, page }) => {
      const aa = homePage.assetAllocator;

      await test.step('21. Allocator phase matches the Macro Index phase', async () => {
        await aa.currentPhase.scrollIntoViewIfNeeded();
        expect(await aa.phase()).toBe((await homePage.macroIndex.currentPhase.innerText()).trim());
      });

      await test.step('22. Each age group updates the doughnut; totals ≈ 100%', async () => {
        const seen = new Set<string>();
        for (const age of assetAllocator.ageGroups) {
          await aa.ageButton(age).click();
          await expect(aa.ageButton(age)).toHaveClass(/font-semibold/);
          await expect.poll(async () => (await aa.percentages()).join(',')).not.toBe([...seen].at(-1) ?? '');
          const pct = await aa.percentages();
          expect(pct).toHaveLength(assetAllocator.classes.length);
          const total = pct.reduce((a, b) => a + b, 0);
          expect(total, `${age}: ${pct.join(' + ')}`).toBeGreaterThanOrEqual(99);
          expect(total, `${age}: ${pct.join(' + ')}`).toBeLessThanOrEqual(101);
          for (const cls of assetAllocator.classes) expect(await aa.legend()).toContain(cls);
          seen.add(pct.join(','));
        }
        expect(seen.size, 'every age group has its own allocation').toBe(assetAllocator.ageGroups.length);
        await expect(aa.roundingNote).toBeVisible();
      });

      await test.step('23. Allocator "Know more" opens its page', async () => {
        await aa.knowMore.click();
        await expect(page).toHaveURL(assetAllocator.url);
        await page.goBack();
      });

      await test.step('24. Correlation table is a 5×5 matrix with 1.00 on the diagonal', async () => {
        const headers = await aa.correlationHeaders();
        const rows = await aa.correlationRows();
        expect(headers).toHaveLength(correlation.size);
        expect(rows).toHaveLength(correlation.size);
        rows.forEach(([name, ...values], i) => {
          expect(name, 'row order matches column order').toBe(headers[i]);
          expect(values[i], `${name} diagonal`).toBe('1.00');
          for (const v of values.filter(Boolean)) {
            expect(Number(v), `${name}: ${v}`).toBeGreaterThanOrEqual(-1);
            expect(Number(v), `${name}: ${v}`).toBeLessThanOrEqual(1);
          }
        });
      });

      await test.step('25. Correlation "Know more" opens its page', async () => {
        await aa.correlationKnowMore.click();
        await expect(page).toHaveURL(correlation.url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.goBack();
      });
    });

    test('Reports and Resources (steps 26–27)', async ({ homePage, page }) => {
      const rr = homePage.reports;

      for (const tab of reports.tabs) {
        await test.step(`26. "${tab}" tab shows complete cards, newest first`, async () => {
          await rr.tab(tab).click();
          await expect(rr.cards.first()).toContainText(tab);
          const cards = await rr.cardData();
          expect(cards.length).toBeGreaterThan(0);
          for (const c of cards) {
            expect.soft(c.title, c.href).not.toBe('');
            expect.soft(c.category, c.href).toBe(tab);
            expect.soft(c.date, c.href).not.toBe('');
            expect.soft(c.readTime, c.href).toMatch(/^\d+ min read$/);
          }
          const times = cards.map((c) => Date.parse(c.date));
          expect(times, 'sorted newest first').toEqual([...times].sort((a, b) => b - a));
        });
      }

      await test.step('27. "Read more" on the first blog opens it with the same title', async () => {
        await rr.tab('Blogs').click();
        const [first] = await rr.cardData();
        await rr.cards.first().click();
        await expect(page).toHaveURL(new RegExp(`${first.href}$`));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title);
        await page.goBack();
      });
    });

    test('footer, newsletter and app links (steps 28–33)', async ({ homePage, page }) => {
      const ft = homePage.footer;

      await test.step('28. Company details and link groups', async () => {
        await ft.root.scrollIntoViewIfNeeded();
        await expect(ft.root).toContainText(footer.cin);
        for (const section of footer.sections) await expect(ft.root.getByText(section, { exact: true })).toBeVisible();
      });

      await test.step('29. Footer links resolve; external ones open in a new tab', async () => {
        const origin = new URL(page.url()).origin;
        for (const { text, href, target } of await ft.linkData()) {
          const res = await page.request.get(href);
          expect.soft(res.status(), `${text} → ${href}`).toBeLessThan(400);
          if (!href.startsWith(origin)) expect.soft(target, `${text} should open in a new tab`).toBe('_blank');
        }
      });

      await test.step('30. Invalid email shows a validation error', async () => {
        await ft.subscribe(footer.invalidEmail);
        await expect(ft.emailError).toHaveText(footer.invalidEmailError);
      });

      await test.step('31. Valid email is submitted (API mocked — prod gets no test subscriber)', async () => {
        let body = '';
        await page.route(footer.subscribeApi, (route) => {
          body = route.request().postData() ?? '';
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });
        await ft.subscribe(footer.testEmail);
        await expect(ft.emailError).toBeHidden();
        await expect.poll(() => body).toContain(footer.testEmail);
        await expect(ft.emailInput).toHaveValue('');
      });

      await test.step('32. "Download the 1 Finance App" links point to the stores', async () => {
        for (const name of footer.appLinks) {
          await expect(ft.appLink(name)).toHaveAttribute('href', footer.appLinkHost);
        }
      });

      await test.step('33. Copyright shows the current year', async () => {
        await expect(ft.copyright).toContainText(`© Copyright ${new Date().getFullYear()}`);
        await expect(ft.copyright).toContainText('indiamacroindicators.co.in');
      });
    });
  });

  test('page health: title, console, network, load time (steps 1, 35)', async ({ homePage, page, isMobile }) => {
    test.skip(isMobile, 'Measured on desktop');
    const consoleErrors = trackConsoleErrors(page);
    const failedRequests = trackFailedRequests(page, thirdPartyNoise);
    await homePage.open();

    await test.step('1. Title is correct', async () => {
      await expect(page).toHaveTitle(homeTitle);
    });

    await test.step('35. No console errors or failed requests after a full scroll; fast load', async () => {
      await homePage.footer.root.scrollIntoViewIfNeeded();
      await page.waitForLoadState('networkidle');
      expect(consoleErrors.filter((e) => !consoleNoise.some((re) => re.test(e)))).toEqual([]);
      expect(failedRequests).toEqual([]);
      const { domContentLoaded } = await homePage.loadTimings();
      expect.soft(domContentLoaded, `DOMContentLoaded ${domContentLoaded}ms`).toBeLessThan(loadBudgetMs);
    });
  });

  test('mobile layout (step 34)', async ({ homePage, page, isMobile }) => {
    test.skip(!isMobile, 'Runs in the mobile-chrome project');
    await page.setViewportSize({ width: mobileWidth, height: 800 });
    await homePage.open();

    await test.step('34. No horizontal scroll, hamburger menu works, cards fit the screen', async () => {
      expect(await homePage.hasHorizontalScroll()).toBe(false);

      await homePage.header.hamburger.click();
      await expect(page.getByRole('link', { name: '1 Finance Macroeconomic Index' }).filter({ visible: true }).first()).toBeVisible();
      await page.reload();

      for (const { name } of indicatorCards) {
        const box = await homePage.cards.card(name).boundingBox();
        expect(box, name).not.toBeNull();
        expect(box!.x + box!.width, `${name} fits within ${mobileWidth}px`).toBeLessThanOrEqual(mobileWidth);
      }
    });
  });
});
