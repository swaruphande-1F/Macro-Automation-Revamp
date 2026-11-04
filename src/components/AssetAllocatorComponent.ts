import type { Locator, Page } from '@playwright/test';

/** Asset Allocator (age buttons + doughnut) and the Correlation Analysis table under it. */
export class AssetAllocatorComponent {
  readonly headingLink: Locator;
  readonly currentPhase: Locator;
  readonly doughnut: Locator;
  readonly roundingNote: Locator;
  readonly knowMore: Locator;
  readonly correlationTable: Locator;
  readonly correlationKnowMore: Locator;

  constructor(private readonly page: Page) {
    this.headingLink = page.getByRole('heading', { level: 2, name: 'Asset Allocator' }).getByRole('link');
    // The page renders a desktop and a mobile copy of this line; take the one on screen.
    this.currentPhase = page.getByText(/^Current phase:/).filter({ visible: true }).first();
    this.doughnut = page.getByText('Recommended Asset Allocation', { exact: true }).locator('xpath=../..').locator('.highcharts-container');
    this.roundingNote = page.getByText('Percentages may not total 100% due to rounding.');
    // Both sections have a "Know more" link; anchor each to the content right next to it.
    this.knowMore = this.roundingNote.locator('xpath=preceding::a[normalize-space()="Know more"][1]');
    this.correlationTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Correlation' }) });
    this.correlationKnowMore = this.correlationTable.locator('xpath=following::a[normalize-space()="Know more"][1]');
  }

  ageButton(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Phase name only, e.g. "Transitory Slowdown". */
  async phase(): Promise<string> {
    return (await this.currentPhase.innerText()).replace(/^Current phase:\s*/, '').trim();
  }

  /** Doughnut slice percentages in slice order, e.g. [40, 27, 12, 14, 8]. */
  async percentages(): Promise<number[]> {
    // Each data label renders its text twice (fill + outline), so read one number per label group.
    return this.doughnut.locator('.highcharts-data-label').evaluateAll((labels) =>
      labels.map((l) => parseFloat(l.textContent ?? '')),
    );
  }

  async legend(): Promise<string> {
    return (await this.doughnut.locator('.highcharts-legend').textContent()) ?? '';
  }

  /** Column headers without the "Correlation" corner cell. */
  async correlationHeaders(): Promise<string[]> {
    return (await this.correlationTable.getByRole('columnheader').allInnerTexts()).slice(1).map((t) => t.trim());
  }

  /** Lower-triangular matrix as rows: [rowName, ...values]; blank upper cells come back as ''. */
  async correlationRows(): Promise<string[][]> {
    return this.correlationTable.locator('tbody tr').evaluateAll((rows) =>
      rows.map((r) => Array.from(r.querySelectorAll('td, th')).map((c) => (c.textContent ?? '').trim())),
    );
  }
}
