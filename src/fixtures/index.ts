import { test as base, expect, type Page } from '@playwright/test';
import { HomePage, EconomicIndicatorsPage, IndicatorDetailPage, SubindicesPage, SubindexDetailPage } from '../pages';
import { NewsletterPopupComponent } from '../components/NewsletterPopupComponent';
import { env } from '../config/env';
import { trackConsoleErrors, trackFailedRequests } from '../utils/helpers';

/**
 * Page objects are injected into tests as fixtures, so specs never call `new XxxPage(page)`.
 * Register every new page object here.
 */
type Pages = {
  homePage: HomePage;
  economicIndicatorsPage: EconomicIndicatorsPage;
  indicatorDetailPage: IndicatorDetailPage;
  subindicesPage: SubindicesPage;
  subindexDetailPage: SubindexDetailPage;
  /** Collects the "Actual" result of a step-per-test case; see `flow*` below. */
  stepLog: StepLog;
};

export type StepLog = {
  /** Adds one line to the step's Actual result shown in the report. */
  actual: (line: string) => void;
  /**
   * Screenshot evidence for the report, taken now. Every step already gets one when it ends
   * ("After step" / "At failure"); call this for extra moments, e.g. before navigating away
   * or of another browser's page: `await stepLog.capture('Tooltip shown')`.
   */
  capture: (label: string, page?: Page) => Promise<void>;
};

/** Viewport screenshot as JPEG: clear enough for evidence, a fraction of a PNG's size. */
async function evidenceShot(page: Page): Promise<Buffer | null> {
  if (page.isClosed()) return null;
  return page.screenshot({ type: 'jpeg', quality: 70, timeout: 5_000 }).catch(() => null);
}

/** What happened on the shared flow page across the whole run (for "final check" steps). */
export type FlowMonitor = { consoleErrors: string[]; failedRequests: string[]; state: Record<string, unknown> };

/**
 * Worker-scoped fixtures: ONE page shared by every test in a worker, so step-per-test
 * specs keep a single continuous browser flow. If a test fails Playwright starts a new
 * worker, these are rebuilt, and the next test carries on from a fresh page.
 */
type Flow = {
  flowPage: Page;
  flowHomePage: HomePage;
  flowSubindicesPage: SubindicesPage;
  flowSubindexDetailPage: SubindexDetailPage;
  flowMonitor: FlowMonitor;
};

export const test = base.extend<Pages, Flow>({
  // Every test gets a page that closes the newsletter popup whenever it gets in the way.
  page: async ({ page }, use) => {
    await new NewsletterPopupComponent(page).autoDismiss();
    await use(page);
  },
  homePage: async ({ page }, use) => use(new HomePage(page)),
  economicIndicatorsPage: async ({ page }, use) => use(new EconomicIndicatorsPage(page)),
  indicatorDetailPage: async ({ page }, use) => use(new IndicatorDetailPage(page)),
  subindicesPage: async ({ page }, use) => use(new SubindicesPage(page)),
  subindexDetailPage: async ({ page }, use) => use(new SubindexDetailPage(page)),

  flowMonitor: [async ({}, use) => use({ consoleErrors: [], failedRequests: [], state: {} }), { scope: 'worker' }],

  flowPage: [async ({ browser, flowMonitor }, use) => {
    // Worker fixtures don't get the config's `use` options, so set the desktop context here.
    const context = await browser.newContext({ baseURL: env.baseURL, viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await new NewsletterPopupComponent(page).autoDismiss();
    flowMonitor.consoleErrors = trackConsoleErrors(page);
    flowMonitor.failedRequests = trackFailedRequests(page);
    await use(page);
    await context.close();
  }, { scope: 'worker' }],

  flowHomePage: [async ({ flowPage }, use) => use(new HomePage(flowPage)), { scope: 'worker' }],
  flowSubindicesPage: [async ({ flowPage }, use) => use(new SubindicesPage(flowPage)), { scope: 'worker' }],
  flowSubindexDetailPage: [async ({ flowPage }, use) => use(new SubindexDetailPage(flowPage)), { scope: 'worker' }],

  stepLog: async ({ flowPage }, use, testInfo) => {
    const lines: string[] = [];
    const capture = async (label: string, page: Page = flowPage) => {
      const shot = await evidenceShot(page);
      if (shot) await testInfo.attach(`evidence: ${label}`, { body: shot, contentType: 'image/jpeg' });
    };
    await use({ actual: (line) => lines.push(line), capture });
    // Runs after the test body, pass or fail, so the report always gets what was observed.
    testInfo.annotations.push({ type: 'Actual', description: lines.join('\n') || '(nothing recorded before the step stopped)' });
    if (testInfo.status !== 'skipped') {
      await capture(testInfo.status === testInfo.expectedStatus ? 'After step' : 'At failure');
    }
  },
});

export { expect };
