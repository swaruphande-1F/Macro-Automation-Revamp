import type { Locator, Page } from '@playwright/test';

export type ReportCard = { href: string; title: string; category: string; date: string; readTime: string };

/** "Reports and Resources" section: tab buttons and up to 4 article cards. */
export class ReportsComponent {
  readonly root: Locator;
  readonly headingLink: Locator;
  readonly cards: Locator;

  constructor(private readonly page: Page) {
    const heading = page.getByRole('heading', { level: 2, name: 'Reports and Resources' });
    // Nearest ancestor that also holds the tab buttons (the heading is not inside a <section>).
    this.root = heading.locator('xpath=ancestor::*[.//button[normalize-space()="Blogs"]][1]');
    this.headingLink = heading.getByRole('link');
    this.cards = this.root.getByRole('link').filter({ hasText: 'Read more' });
  }

  tab(name: string): Locator {
    return this.root.getByRole('button', { name, exact: true });
  }

  /** Card fields read from the DOM: <p> title, then category badge, date and "N min read" spans. */
  async cardData(): Promise<ReportCard[]> {
    return this.cards.evaluateAll((links) =>
      links.map((a) => {
        const spans = Array.from(a.querySelectorAll('span')).map((s) => (s.textContent ?? '').trim()).filter(Boolean);
        return {
          href: a.getAttribute('href') ?? '',
          title: (a.querySelector('p')?.textContent ?? '').trim(),
          category: spans[0] ?? '',
          date: spans.find((s) => /^[A-Z][a-z]+ \d{2}, \d{4}$/.test(s)) ?? '',
          readTime: spans.find((s) => /min read$/.test(s)) ?? '',
        };
      }),
    );
  }
}
