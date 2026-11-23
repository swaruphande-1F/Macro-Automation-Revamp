import type { Locator, Page } from '@playwright/test';
import { HighchartComponent } from './HighchartComponent';

/**
 * One card on /subindices. Children, in order: icon + title link, chart (hidden when
 * Show charts is off), "Near-term Outlook" + sentiment icon, outlook text, Know more.
 */
export class SubindexCardComponent {
  readonly icon: Locator;
  readonly title: Locator;
  readonly titleLink: Locator;
  readonly chartRoot: Locator;
  readonly chart: HighchartComponent;
  /** "index value 51.2" label drawn on the chart. */
  readonly badge: Locator;
  readonly badgeValue: Locator;
  readonly outlookHeading: Locator;
  /** alt is "positive outlook", "negative outlook", … */
  readonly sentimentIcon: Locator;
  readonly outlookText: Locator;
  readonly knowMore: Locator;

  constructor(page: Page, readonly root: Locator) {
    this.icon = root.locator('img[src*="/asset/icons/"]').first();
    this.title = root.getByRole('heading', { level: 2 });
    this.titleLink = root.locator('a:has(h2)');
    this.chartRoot = root.locator('[data-highcharts-chart]');
    this.chart = new HighchartComponent(page, this.chartRoot.first());
    this.badge = root.locator('.bordered-label');
    this.badgeValue = this.badge.locator('span');
    this.outlookHeading = root.getByText('Near-term Outlook', { exact: true });
    this.sentimentIcon = root.locator('img[alt$="outlook"]');
    this.outlookText = root.locator(':scope > p');
    this.knowMore = root.getByRole('link', { name: 'Know more' });
  }

  async titleText(): Promise<string> {
    return (await this.title.innerText()).trim();
  }

  async badgeText(): Promise<string> {
    return ((await this.badgeValue.first().textContent()) ?? '').trim();
  }

  async outlook(): Promise<string> {
    return (await this.outlookText.innerText()).replace(/\s+/g, ' ').trim();
  }

  async knowMoreHref(): Promise<string | null> {
    return this.knowMore.getAttribute('href');
  }
}
