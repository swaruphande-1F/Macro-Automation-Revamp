import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';

/** Listing page: /economic-indicators and /economic-indicators/category/<slug>. */
export class EconomicIndicatorsPage extends BasePage {
  protected path = '/economic-indicators';

  readonly header: HeaderComponent;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async openCategory(slug: string): Promise<this> {
    this.path = `/economic-indicators/category/${slug}`;
    return this.open();
  }

  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
  }
}
