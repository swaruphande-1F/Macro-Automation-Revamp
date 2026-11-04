import type { Locator, Page } from '@playwright/test';

/**
 * "1 Finance Macroeconomic Index" section: phase gauge, summary and a Highcharts chart.
 * The section also holds an off-screen copy of itself used for image export, so every
 * locator takes `.first()` (the on-screen copy comes first in the DOM).
 */
export class MacroIndexComponent {
  readonly root: Locator;
  readonly headingLink: Locator;
  readonly currentPhase: Locator;
  readonly indexValue: Locator;
  readonly successRate: Locator;
  readonly summary: Locator;
  readonly interpretationLink: Locator;
  readonly interpretationModal: Locator;
  readonly chart: Locator;
  readonly tooltip: Locator;
  /** "Showing: Index Value • Range: 10 Years" — lives in the export copy, kept in sync with the tabs. */
  readonly showingLabel: Locator;
  readonly embedLink: Locator;
  readonly embedModal: Locator;
  readonly lastUpdated: Locator;

  constructor(private readonly page: Page) {
    const heading = page.getByRole('heading', { level: 2, name: '1 Finance Macroeconomic Index' });
    this.root = page.locator('section').filter({ has: heading });
    this.headingLink = heading.getByRole('link');
    this.currentPhase = this.root.getByText('Current Phase', { exact: true }).first().locator('xpath=following-sibling::p[1]');
    this.indexValue = this.root.getByText(/^Index Value: /).first();
    this.successRate = this.root.getByText(/Success rate/).first();
    this.summary = this.root.getByText('Summary', { exact: true }).first().locator('xpath=following-sibling::p[1]');
    this.interpretationLink = this.root.getByText('More on Interpretation', { exact: true });
    this.interpretationModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Interpretation' }).filter({ hasText: 'Recession' });
    this.chart = this.root.locator('.highcharts-container').first();
    this.tooltip = this.chart.locator('.highcharts-tooltip');
    this.showingLabel = this.root.getByText(/^Showing:/);
    this.embedLink = this.root.getByText('How to Embed this Chart?', { exact: true });
    this.embedModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Learn How to Embed Charts' });
    this.lastUpdated = this.root.getByText(/^Last Updated:/).first();
  }

  /** A series or range toggle, e.g. 'YoY Growth in GDP' or '5Y'. */
  tab(name: string): Locator {
    return this.root.getByText(name, { exact: true }).first();
  }

  /** The pill around a tab; the selected one gets a white background. */
  tabPill(name: string): Locator {
    return this.tab(name).locator('xpath=..');
  }

  /** Concatenated x-axis label text, e.g. "Nov '25Jan '26…". */
  async xAxisText(): Promise<string> {
    return (await this.chart.locator('.highcharts-xaxis-labels').first().textContent()) ?? '';
  }

  /** The "Last Updated: … Source: CMIE …, 1 Finance Research" line. */
  footerLine(): Locator {
    return this.lastUpdated.locator('xpath=..');
  }

  /** Moves the mouse across the plot until Highcharts shows a tooltip (edges of the plot have no points). */
  async hoverChart(): Promise<void> {
    await this.chart.scrollIntoViewIfNeeded();
    const box = await this.chart.boundingBox();
    if (!box) throw new Error('Chart has no bounding box');
    for (const x of [0.5, 0.6, 0.7, 0.8, 0.4]) {
      // locator.hover (not page.mouse) so the newsletter popup handler can run first.
      await this.chart.hover({ position: { x: box.width * x, y: box.height * 0.5 } });
      if (await this.tooltip.first().waitFor({ timeout: 1_000 }).then(() => true, () => false)) return;
    }
  }

  /** These modals close on a click outside the dialog, not on Escape. */
  async closeModal(modal: Locator): Promise<void> {
    await modal.click({ position: { x: 5, y: 5 } });
  }
}
