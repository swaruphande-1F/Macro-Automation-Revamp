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
  /** "Learn How to Embed Charts" — the tutorial-video modal opened by the "How to Embed" link. */
  readonly embedModal: Locator;
  /** Share icon next to "How to Embed this Chart?"; opens the Embed / Share / Copy menu. */
  readonly shareButton: Locator;
  /** "Embed Chart" modal opened from share menu → "Embed this chart". Holds the <iframe> code. */
  readonly embedCodeModal: Locator;
  readonly embedCode: Locator;
  readonly embedCopyIcon: Locator;
  readonly embedCodeClose: Locator;
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
    // The share button is the first icon button right after the "How to Embed" link.
    this.shareButton = this.embedLink.locator('xpath=following-sibling::div[1]//button').first();
    this.embedCodeModal = page.locator('div.fixed.inset-0').filter({ has: page.getByText('Embed Chart', { exact: true }) });
    // The code is plain text in a <p> (not a textarea), starting with "<iframe".
    this.embedCode = this.embedCodeModal.getByText(/<iframe/);
    this.embedCopyIcon = this.embedCodeModal.locator('svg.lucide-copy');
    // The × icon sits right after the "Embed Chart" title.
    this.embedCodeClose = this.embedCodeModal.getByText('Embed Chart', { exact: true }).locator('xpath=following-sibling::*[1]');
    this.lastUpdated = this.root.getByText(/^Last Updated:/).first();
  }

  /** An item in the share menu: 'Embed this chart', 'Share via..', 'Copy chart as image', 'Copy link to chart'. */
  shareMenuItem(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
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
