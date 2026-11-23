import type { Locator, Page } from '@playwright/test';

/** Site footer: company details, link groups, newsletter form, app links, copyright. */
export class FooterComponent {
  readonly root: Locator;
  readonly links: Locator;
  readonly emailInput: Locator;
  readonly subscribeButton: Locator;
  readonly emailError: Locator;
  readonly subscribeMessage: Locator;
  readonly copyright: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('footer');
    this.links = this.root.getByRole('listitem').getByRole('link');
    this.emailInput = this.root.getByRole('textbox', { name: 'Enter your email' });
    this.subscribeButton = this.root.locator('form button[type="submit"]');
    this.emailError = this.root.locator('form').getByText(/^Invalid email/);
    /** Status line under the input after submit (success, already subscribed, or error). */
    this.subscribeMessage = this.root.locator('form > p.mt-1');
    this.copyright = this.root.getByText(/© Copyright/).locator('xpath=..');
  }

  /** App badges are image links; the accessible name comes from the <img alt>. */
  appLink(name: string): Locator {
    return this.root.getByRole('link').filter({ has: this.page.getByRole('img', { name, exact: true }) });
  }

  /** Every link in the footer lists with its text, href and target. */
  async linkData(): Promise<{ text: string; href: string; target: string | null }[]> {
    return this.links.evaluateAll((as) =>
      as.map((a) => ({ text: (a.textContent ?? '').trim(), href: (a as HTMLAnchorElement).href, target: a.getAttribute('target') })),
    );
  }

  async subscribe(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }
}
