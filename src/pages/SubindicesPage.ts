import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';
import { FooterComponent } from '../components/FooterComponent';
import { SubindexCardComponent } from '../components/SubindexCardComponent';

/** Listing page: /subindices — 8 cards and a Show charts toggle. */
export class SubindicesPage extends BasePage {
  protected readonly path = '/subindices';

  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  /** Desktop and mobile breadcrumbs are both in the DOM; only one is visible. */
  readonly breadcrumb: Locator;
  readonly breadcrumbHome: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  /** The real checkbox is visually hidden (sr-only); the switch drawn on screen is its <label>. */
  readonly chartsToggle: Locator;
  readonly chartsSwitch: Locator;
  readonly cardRoots: Locator;
  readonly charts: Locator;
  readonly badges: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
    const main = page.locator('main');
    this.breadcrumb = main.locator('div:has(> a[href="/"])').filter({ visible: true }).first();
    this.breadcrumbHome = this.breadcrumb.locator('a[href="/"]');
    this.heading = main.getByRole('heading', { level: 1 });
    this.subtitle = this.heading.locator('xpath=following-sibling::p[1]');
    this.chartsToggle = main.locator('input[type="checkbox"]');
    this.chartsSwitch = this.chartsToggle.locator('xpath=..');
    this.cardRoots = main.locator('div.grid > div').filter({ has: page.getByRole('heading', { level: 2 }) });
    this.charts = this.cardRoots.locator('[data-highcharts-chart]');
    this.badges = this.cardRoots.locator('.bordered-label');
  }

  /** Card by position (0-based) or by its exact title. */
  card(which: number | string): SubindexCardComponent {
    const root = typeof which === 'number'
      ? this.cardRoots.nth(which)
      : this.cardRoots.filter({ has: this.page.getByRole('heading', { level: 2, name: which, exact: true }) });
    return new SubindexCardComponent(this.page, root);
  }

  async cards(): Promise<SubindexCardComponent[]> {
    const n = await this.cardRoots.count();
    return Array.from({ length: n }, (_, i) => this.card(i));
  }

  async cardTitles(): Promise<string[]> {
    return (await this.cardRoots.getByRole('heading', { level: 2 }).allInnerTexts()).map((t) => t.trim());
  }

  async breadcrumbText(): Promise<string> {
    return (await this.breadcrumb.innerText()).replace(/\s+/g, ' ').trim();
  }

  async chartsOn(): Promise<boolean> {
    return this.chartsToggle.isChecked();
  }

  async clickChartsToggle(): Promise<void> {
    await this.chartsSwitch.click();
  }

  /** Puts the toggle in a known state, e.g. when a step starts on a fresh page. */
  async setCharts(on: boolean): Promise<void> {
    if ((await this.chartsOn()) !== on) await this.clickChartsToggle();
    await expect(this.chartsToggle).toBeChecked({ checked: on });
  }

  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
    await this.cardRoots.first().waitFor();
  }
}
