import { test as base, expect } from '@playwright/test';
import { HomePage, EconomicIndicatorsPage, IndicatorDetailPage } from '../pages';
import { NewsletterPopupComponent } from '../components/NewsletterPopupComponent';

/**
 * Page objects are injected into tests as fixtures, so specs never call `new XxxPage(page)`.
 * Register every new page object here.
 */
type Pages = {
  homePage: HomePage;
  economicIndicatorsPage: EconomicIndicatorsPage;
  indicatorDetailPage: IndicatorDetailPage;
};

export const test = base.extend<Pages>({
  // Every test gets a page that closes the newsletter popup whenever it gets in the way.
  page: async ({ page }, use) => {
    await new NewsletterPopupComponent(page).autoDismiss();
    await use(page);
  },
  homePage: async ({ page }, use) => use(new HomePage(page)),
  economicIndicatorsPage: async ({ page }, use) => use(new EconomicIndicatorsPage(page)),
  indicatorDetailPage: async ({ page }, use) => use(new IndicatorDetailPage(page)),
});

export { expect };
