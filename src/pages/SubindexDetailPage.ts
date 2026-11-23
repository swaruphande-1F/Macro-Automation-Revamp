import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';
import { HighchartComponent } from '../components/HighchartComponent';

export type DetailSection = 'chart' | 'overview' | 'description' | 'usability' | 'historical-events';

export type HistoricalEvent = { month: string; year: string; title: string; description: string };

/**
 * A subindex page, e.g. /subindices/services-sector-activity-index.
 * The chart section also holds an off-screen copy of the phase panel and chart (used for
 * "How to Embed" / download), so locators take the first match, which is the one on screen.
 */
export class SubindexDetailPage extends BasePage {
  protected path = '/subindices';

  readonly header: HeaderComponent;
  readonly heading: Locator;
  readonly breadcrumbSubindices: Locator;
  readonly chartSection: Locator;
  readonly phaseName: Locator;
  readonly phaseIndexValue: Locator;
  readonly successRate: Locator;
  readonly summary: Locator;
  readonly interpretationLink: Locator;
  readonly interpretationModal: Locator;
  readonly chart: HighchartComponent;
  /** "Showing: Index Value • Range: 10 Years" — only in the off-screen copy, but kept in sync. */
  readonly rangeLabel: Locator;
  readonly lastUpdated: Locator;
  readonly source: Locator;
  readonly recentUpdates: Locator;
  readonly nearTermOutlook: Locator;
  readonly nearTermPoints: Locator;
  readonly highFrequencyIndicators: Locator;
  readonly historicalEvents: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    const main = page.locator('main');
    this.heading = main.getByRole('heading', { level: 1 });
    this.breadcrumbSubindices = main.getByRole('link', { name: 'Subindices', exact: true }).filter({ visible: true }).first();
    this.chartSection = this.section('chart');
    this.phaseName = this.chartSection.getByText('Current Phase', { exact: true }).first().locator('xpath=following-sibling::p[1]');
    this.phaseIndexValue = this.chartSection.getByText(/^Index Value: /).first();
    this.successRate = this.chartSection.getByText(/Success rate$/).first();
    this.summary = this.chartSection.getByText('Summary', { exact: true }).first().locator('xpath=following-sibling::p[1]');
    this.interpretationLink = this.chartSection.getByText('More on Interpretation', { exact: true });
    this.interpretationModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Interpretation' }).filter({ hasNotText: 'Join the growing community' });
    this.chart = new HighchartComponent(page, this.chartSection.locator('[data-highcharts-chart]').first());
    this.rangeLabel = this.chartSection.locator('p', { hasText: 'Showing:' }).first();
    this.lastUpdated = this.chartSection.getByText(/^Last Updated:/).first();
    this.source = this.chartSection.locator('div', { hasText: /^Source:/ }).filter({ visible: true }).first();
    this.recentUpdates = main.getByRole('heading', { name: 'Recent Updates', level: 3 });
    this.nearTermOutlook = main.getByRole('heading', { name: 'Near-term Outlook', level: 3 });
    this.nearTermPoints = this.nearTermOutlook.locator('xpath=following::ul[1]/li');
    this.highFrequencyIndicators = this.section('description').locator('a[href^="/economic-indicators/"]');
    this.historicalEvents = this.section('historical-events');
  }

  async openSubindex(slug: string): Promise<this> {
    this.path = `/subindices/${slug}`;
    return this.open();
  }

  section(id: DetailSection): Locator {
    return this.page.locator(`[data-tab-id="${id}"]`);
  }

  /** Sticky section tabs: Chart, Overview, Description, Usability, Historical Events. */
  tab(name: string): Locator {
    return this.page.locator('main button', { hasText: new RegExp(`^${name}$`) }).first();
  }

  async tabNames(): Promise<string[]> {
    return this.page.locator('div.sticky button').allInnerTexts().then((t) => t.map((s) => s.trim()));
  }

  /** Chart view and range switches ("Index Value", "1Y", …) are clickable divs. */
  chartOption(label: string): Locator {
    return this.chartSection.locator('div.cursor-pointer', { has: this.page.getByText(label, { exact: true }) }).first();
  }

  /** The selected option has a white background. */
  async isOptionActive(label: string): Promise<boolean> {
    return ((await this.chartOption(label).getAttribute('class')) ?? '').split(/\s+/).includes('bg-white');
  }

  /** Legend entries under the chart (each appears twice: chart and its off-screen copy). */
  async legends(): Promise<string[]> {
    const all = await this.chartSection.locator('p.legend_text').allTextContents();
    return [...new Set(all.map((t) => t.trim()))];
  }

  async indexValue(): Promise<number> {
    return Number(((await this.phaseIndexValue.innerText()).match(/-?\d+(\.\d+)?/) ?? ['NaN'])[0]);
  }

  async lastUpdatedDate(): Promise<string> {
    return (await this.lastUpdated.innerText()).replace(/^Last Updated:\s*/, '').trim();
  }

  async sourceText(): Promise<string> {
    return (await this.source.innerText()).replace(/^Source:\s*/, '').replace(/\s+/g, ' ').trim();
  }

  async closeInterpretation(): Promise<void> {
    // The modal closes on a click outside its content.
    await this.page.mouse.click(5, 5);
    await this.interpretationModal.waitFor({ state: 'hidden' });
  }

  /** Events on the current Historical Events page, top to bottom. */
  async events(): Promise<HistoricalEvent[]> {
    return this.historicalEvents.evaluate((section) =>
      [...section.querySelectorAll('h3')].map((h) => {
        const row = h.parentElement!.parentElement!.parentElement!;
        const [month, year] = [...row.querySelectorAll(':scope > div:first-child p')].map((p) => (p.textContent ?? '').trim());
        return {
          month: month ?? '',
          year: year ?? '',
          title: (h.textContent ?? '').trim(),
          description: (h.parentElement!.nextElementSibling?.textContent ?? '').trim(),
        };
      }),
    );
  }

  eventsPage(n: number): Locator {
    return this.historicalEvents.getByRole('button', { name: String(n), exact: true });
  }

  /** The current pagination page has a grey background. */
  async isEventsPageActive(n: number): Promise<boolean> {
    return ((await this.eventsPage(n).getAttribute('class')) ?? '').includes('bg-[#eaecf0]');
  }

  /** True once the element's top edge is in the upper part of the viewport (after a tab scroll). */
  async isScrolledTo(target: Locator): Promise<boolean> {
    const box = await target.boundingBox();
    const height = this.page.viewportSize()?.height ?? 720;
    return !!box && box.y >= 0 && box.y < height * 0.6;
  }

  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
  }
}
