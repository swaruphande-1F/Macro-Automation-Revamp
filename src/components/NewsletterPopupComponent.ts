import type { Locator, Page } from '@playwright/test';

/**
 * "Join the growing community…" signup modal that opens ~14s after any page loads
 * and blocks every click underneath it.
 */
export class NewsletterPopupComponent {
  readonly root: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('div.fixed.inset-0').filter({ hasText: 'Join the growing community' });
    this.closeButton = this.root.locator('span.absolute.right-4.top-4');
  }

  /** Closes the popup automatically whenever it shows up before a Playwright action. */
  async autoDismiss(): Promise<void> {
    await this.page.addLocatorHandler(this.root, async () => {
      await this.closeButton.click();
    });
  }
}
