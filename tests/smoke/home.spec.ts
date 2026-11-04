import { test, expect } from '@fixtures';

test.describe('Home page', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('shows title and hero heading', async ({ homePage, page }) => {
    await expect(page).toHaveTitle(/Indian Macroeconomic Indicators/);
    await expect(homePage.heroHeading).toHaveText('Real Time Macroeconomic Insights for Personal Finance');
  });

  test('shows the 1 Finance Macroeconomic Index section', async ({ homePage }) => {
    await expect(homePage.macroIndexHeading).toBeVisible();
  });

  test('header navigates to Asset Allocator', async ({ homePage, page, isMobile }) => {
    test.skip(isMobile, 'Desktop nav is behind the hamburger menu on mobile');
    await homePage.header.navigate('Tools', 'Asset Allocator');
    await expect(page).toHaveURL(/\/asset-allocator/);
  });
});
