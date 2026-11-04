import type { Locator, Page } from '@playwright/test';

/** Rotating announcement strip above the hero, with Previous/Next arrows. */
export class AnnouncementBarComponent {
  readonly previous: Locator;
  readonly next: Locator;
  /** The announcement currently shown — the link between the two arrows. */
  readonly link: Locator;

  constructor(private readonly page: Page) {
    this.previous = page.getByRole('button', { name: 'Previous announcement' });
    this.next = page.getByRole('button', { name: 'Next announcement' });
    this.link = this.next.locator('xpath=preceding-sibling::a[1]');
  }

  /** Clicks Next until the announcement containing `text` is shown. */
  async showAnnouncement(text: string, maxClicks = 10): Promise<void> {
    const target = this.link.filter({ hasText: text });
    for (let i = 0; i < maxClicks; i++) {
      // Give the slide transition time to finish before deciding to click again.
      if (await target.waitFor({ timeout: 1_500 }).then(() => true, () => false)) return;
      await this.next.click();
    }
    throw new Error(`Announcement "${text}" not found after ${maxClicks} clicks`);
  }
}
