import { expect, type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../config/timeouts';

/**
 * Every page object extends this.
 * Put behaviour shared by ALL pages here (navigation, waits, common checks).
 * Do NOT put page-specific locators here.
 */
export abstract class BasePage {
  /** Path relative to baseURL, e.g. '/' or '/gdp'. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<this> {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded', timeout: Timeouts.pageLoad });
    await this.waitForLoaded();
    return this;
  }

  /** Override in a page if it needs a stronger "ready" signal. */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  url(): string {
    return this.page.url();
  }

  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible({ timeout: Timeouts.medium });
  }
}
