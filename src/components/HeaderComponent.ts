import type { Locator, Page } from '@playwright/test';

export type HeaderMenu =
  | 'India Macroeconomic Indices'
  | 'Economic Indicators'
  | 'Tools';

/**
 * The site header appears on every page, so it is a component,
 * not a page. Page objects expose it as `xxxPage.header`.
 */
export class HeaderComponent {
  readonly root: Locator;
  readonly logo: Locator;
  /** Only shown below tablet width. Its <img> is mislabelled alt="search-icon", so match by icon file. */
  readonly hamburger: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('header');
    this.logo = this.root.locator('a[href="/"]').first();
    this.hamburger = this.root.locator('button:has(img[src*="hamburger"])');
  }

  menu(name: HeaderMenu): Locator {
    return this.root.getByText(name, { exact: true }).first();
  }

  /** Any top-level item, dropdown or plain link. */
  topLevel(name: string): Locator {
    return this.root.getByRole('navigation').getByRole('link', { name, exact: true }).first();
  }

  /** Top-level links that are not dropdowns. */
  link(name: 'Global Market P/E' | 'Reports and Resources'): Locator {
    return this.root.getByRole('link', { name, exact: true }).first();
  }

  /** The mega-menu panel. It is always in the DOM and only fades in (opacity 0 → 1) on hover. */
  dropdown(name: HeaderMenu): Locator {
    return this.menu(name).locator('xpath=following-sibling::div[1]');
  }

  dropdownItem(menu: HeaderMenu, item: string): Locator {
    return this.dropdown(menu).getByRole('link', { name: item }).first();
  }

  async openMenu(name: HeaderMenu): Promise<void> {
    await this.menu(name).hover();
  }

  /** Hover a dropdown menu and click an item inside it, e.g. ('Tools', 'Asset Allocator'). */
  async navigate(menu: HeaderMenu, item: string): Promise<void> {
    await this.openMenu(menu);
    await this.root.getByRole('link', { name: item }).first().click();
  }

  async goHome(): Promise<void> {
    await this.logo.click();
  }
}
