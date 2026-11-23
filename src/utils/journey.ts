import type { BrowserType } from '@playwright/test';
import { env } from '../config/env';
import { NewsletterPopupComponent } from '../components/NewsletterPopupComponent';
import { SubindicesPage, SubindexDetailPage } from '../pages';
import { subindexList, subindexPath, subindices } from '../data/subindices';

export type JourneyResult = { lines: string[]; problems: string[]; columns?: number };

/**
 * The short Subindices journey used by the compatibility steps, in a browser of its own:
 * load /subindices, toggle charts off and on, open a Know more link, go Back.
 * Runs outside the fixtures (it launches its own browser), so it builds its page objects here.
 */
export async function runSubindicesJourney(
  browserType: BrowserType,
  opts: { channel?: string; viewport?: { width: number; height: number } } = {},
): Promise<JourneyResult> {
  const lines: string[] = [];
  const problems: string[] = [];
  const check = (ok: boolean, what: string) => { if (!ok) problems.push(what); };

  const browser = await browserType.launch(opts.channel ? { channel: opts.channel } : {});
  try {
    lines.push(`Launched ${browserType.name()}${opts.channel ? ` (${opts.channel})` : ''} ${browser.version()}`);
    const context = await browser.newContext({ baseURL: env.baseURL, viewport: opts.viewport ?? { width: 1280, height: 720 } });
    const page = await context.newPage();
    await new NewsletterPopupComponent(page).autoDismiss();
    const list = new SubindicesPage(page);
    const detail = new SubindexDetailPage(page);

    const response = await page.goto(subindices.path, { waitUntil: 'domcontentloaded' });
    await list.waitForLoaded();
    const cards = await list.cardRoots.count();
    lines.push(`Load: HTTP ${response?.status()}, ${cards} cards`);
    check(response?.status() === 200, `load returned HTTP ${response?.status()}`);
    check(cards === subindices.cardCount, `${cards} cards instead of ${subindices.cardCount}`);

    // Card columns: how many distinct left edges the cards have.
    const xs = await list.cardRoots.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
    const columns = new Set(xs).size;

    await list.clickChartsToggle();
    await list.charts.first().waitFor({ state: 'detached' }).catch(() => {});
    const off = await list.charts.count();
    await list.clickChartsToggle();
    await list.charts.nth(subindices.cardCount - 1).waitFor().catch(() => {});
    const on = await list.charts.count();
    lines.push(`Toggle off → ${off} charts; on → ${on} charts`);
    check(off === 0, `${off} charts still shown with the toggle off`);
    check(on === subindices.cardCount, `${on} charts shown with the toggle on`);

    const target = subindexList[0];
    await list.card(target.title).knowMore.click();
    await page.waitForURL(`**${subindexPath(target.slug)}`).catch(() => {});
    await detail.waitForLoaded().catch(() => {});
    const opened = new URL(page.url()).pathname;
    lines.push(`Know more → ${opened}`);
    check(opened === subindexPath(target.slug), `Know more opened ${opened}`);

    await page.goBack();
    await list.waitForLoaded().catch(() => {});
    const back = new URL(page.url()).pathname;
    lines.push(`Back → ${back}`);
    check(back === subindices.path, `Back went to ${back}`);

    await context.close();
    return { lines, problems, columns };
  } finally {
    await browser.close();
  }
}
