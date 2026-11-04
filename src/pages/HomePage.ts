import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';
import { AnnouncementBarComponent } from '../components/AnnouncementBarComponent';
import { IndicatorCardsComponent } from '../components/IndicatorCardsComponent';
import { MacroIndexComponent } from '../components/MacroIndexComponent';
import { AssetAllocatorComponent } from '../components/AssetAllocatorComponent';
import { ReportsComponent } from '../components/ReportsComponent';
import { FooterComponent } from '../components/FooterComponent';

export class HomePage extends BasePage {
  protected readonly path = '/';

  readonly header: HeaderComponent;
  readonly announcements: AnnouncementBarComponent;
  readonly cards: IndicatorCardsComponent;
  readonly macroIndex: MacroIndexComponent;
  readonly assetAllocator: AssetAllocatorComponent;
  readonly reports: ReportsComponent;
  readonly footer: FooterComponent;
  readonly heroHeading: Locator;
  readonly heroSubtext: Locator;
  readonly macroIndexHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.announcements = new AnnouncementBarComponent(page);
    this.cards = new IndicatorCardsComponent(page);
    this.macroIndex = new MacroIndexComponent(page);
    this.assetAllocator = new AssetAllocatorComponent(page);
    this.reports = new ReportsComponent(page);
    this.footer = new FooterComponent(page);
    this.heroHeading = page.getByRole('heading', { level: 1 });
    this.heroSubtext = this.heroHeading.locator('xpath=following::p[1]');
    this.macroIndexHeading = page.getByRole('heading', { level: 2, name: '1 Finance Macroeconomic Index' });
  }

  heroButton(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  /** Navigation timing for the current document, in ms from navigation start. */
  async loadTimings(): Promise<{ domContentLoaded: number; load: number }> {
    return this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) };
    });
  }

  /** True when the page is wider than the viewport, i.e. it scrolls sideways. */
  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  async waitForLoaded(): Promise<void> {
    await this.heroHeading.waitFor();
  }
}
