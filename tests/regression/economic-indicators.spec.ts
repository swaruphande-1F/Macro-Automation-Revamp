import { test, expect } from '@fixtures';
import { categories, keyIndicators } from '@data/indicators';

test.describe('Economic Indicators', { tag: '@regression' }, () => {
  test('listing page loads', async ({ economicIndicatorsPage }) => {
    await economicIndicatorsPage.open();
    await expect(economicIndicatorsPage.heading).toHaveText('Economic Indicators');
  });

  // Data-driven: one test per category, generated from src/data.
  for (const { slug, title } of categories) {
    test(`category "${title}" loads`, async ({ economicIndicatorsPage, page }) => {
      await economicIndicatorsPage.openCategory(slug);
      await expect(page).toHaveURL(new RegExp(`/category/${slug}`));
      await expect(page).toHaveTitle(new RegExp(title.split(' ')[0]));
    });
  }

  for (const { slug, heading } of keyIndicators) {
    test(`indicator "${slug}" shows its heading`, async ({ indicatorDetailPage }) => {
      await indicatorDetailPage.openIndicator(slug);
      await expect(indicatorDetailPage.heading).toHaveText(heading);
    });
  }
});
