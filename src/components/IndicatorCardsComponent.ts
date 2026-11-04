import type { Locator, Page } from '@playwright/test';

/** The 8 key-indicator cards below the hero. Each card is one <a> link. */
export class IndicatorCardsComponent {
  constructor(private readonly page: Page) {}

  /**
   * Only cards have a "Last updated" label, so this skips header and dropdown links
   * that mention the same words (e.g. "Monitors repo rate trends…").
   */
  card(name: string): Locator {
    return this.page
      .getByRole('link')
      .filter({ has: this.page.getByText('Last updated', { exact: true }) })
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .first();
  }

  async text(name: string): Promise<string> {
    return (await this.card(name).innerText()).trim();
  }

  /** The date just above the card's "Last updated" label, e.g. "3 Nov, 2026" or "Q1 FY2027". */
  async lastUpdated(name: string): Promise<string> {
    return this.card(name)
      .getByText('Last updated', { exact: true })
      .locator('xpath=preceding-sibling::span[1]')
      .innerText();
  }
}
