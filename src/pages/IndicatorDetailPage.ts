import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';

/** A single indicator page, e.g. /economic-indicators/repo-rate. */
export class IndicatorDetailPage extends BasePage {
  protected path = '/economic-indicators';

  readonly header: HeaderComponent;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async openIndicator(slug: string): Promise<this> {
    this.path = `/economic-indicators/${slug}`;
    return this.open();
  }

  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
  }
}
