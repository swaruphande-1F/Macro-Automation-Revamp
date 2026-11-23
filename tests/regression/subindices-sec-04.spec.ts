import type { Dialog, Page, Response } from '@playwright/test';
import { test, expect } from '@fixtures';
import { env } from '@config/env';
import { tc, testCase } from '@data/tc-imi-subindices-sec-04';
import { negative, security, subindices } from '@data/subindices';
import { ensureAt, openingSteps } from '@utils/flow';

/**
 * TC_IMI_SUBINDICES_SEC_04 — one test per step on ONE shared page (`flowPage`); see
 * subindices-e2e-01.spec.ts for how the flow and the step report work.
 * Every payload here is harmless (alert() probes and read-only page URLs). No test data is
 * written: the write requests in step 9 go to the public page URL and are expected to be refused.
 */
test.describe(`${testCase.id}: ${testCase.title}`, {
  tag: ['@regression', '@security', '@subindices'],
  annotation: { type: 'testcase', description: testCase.id },
}, () => {
  test.describe.configure({ mode: 'default' });
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, `Precondition: ${testCase.precondition}`);

  const url = (path: string) => new URL(path.replace(/^\//, ''), env.baseURL).href;

  /** Records any alert/confirm/prompt raised while `fn` runs, and dismisses it. */
  async function dialogsDuring(page: Page, fn: () => Promise<void>): Promise<string[]> {
    const seen: string[] = [];
    const onDialog = (d: Dialog) => { seen.push(`${d.type()}: ${d.message()}`); void d.dismiss(); };
    page.on('dialog', onDialog);
    try {
      await fn();
      // Give an injected handler time to fire.
      await page.waitForTimeout(1_000);
    } finally {
      page.off('dialog', onDialog);
    }
    return seen;
  }

  const leaks = (text: string) => security.leakPatterns.filter((re) => re.test(text)).map(String);

  test(tc(1).title, tc(1).details, async ({ flowPage: page, stepLog }) => {
    await openingSteps.openBrowser(page, stepLog);
  });

  test(tc(2).title, tc(2).details, async ({ flowPage: page, stepLog }) => {
    let finalUrl = '';
    let error = '';
    const response = await page.goto(security.httpUrl, { waitUntil: 'domcontentloaded' }).catch((e: Error) => {
      error = e.message.split('\n')[0];
      return null;
    });
    if (response) finalUrl = page.url();
    stepLog.actual(error ? `${security.httpUrl} → ${error} (no redirect)` : `${security.httpUrl} → ${finalUrl} (HTTP ${response?.status()})`);

    // Certificate of the HTTPS page, whether or not the redirect worked.
    const https = response && finalUrl.startsWith('https:') ? response : await page.goto(url(subindices.path), { waitUntil: 'domcontentloaded' });
    const cert = await https?.securityDetails();
    const now = Date.now() / 1000;
    const certValid = !!cert && (cert.validFrom ?? 0) <= now && now <= (cert.validTo ?? 0);
    stepLog.actual(cert
      ? `Certificate: ${cert.subjectName}, issued by ${cert.issuer}, ${cert.protocol}, valid until ${new Date((cert.validTo ?? 0) * 1000).toDateString()} — ${certValid ? 'valid' : 'NOT valid'}`
      : 'No certificate details');

    expect.soft(certValid, 'Valid certificate').toBe(true);
    expect(finalUrl, 'Redirected to HTTPS').toMatch(/^https:\/\//);
  });

  test(tc(3).title, tc(3).details, async ({ flowPage: page, stepLog }) => {
    const response = await page.goto(url(subindices.path), { waitUntil: 'domcontentloaded' });
    const headers = response?.headers() ?? {};
    const missing = security.requiredHeaders.filter((h) => !headers[h]);
    const framing = !!headers[security.framingHeader] || /frame-ancestors/i.test(headers['content-security-policy'] ?? '');
    if (!framing) missing.push('x-frame-options or CSP frame-ancestors');
    for (const h of [...security.requiredHeaders, security.framingHeader]) stepLog.actual(`${h}: ${headers[h] ?? '(missing)'}`);
    stepLog.actual(`Also sent: server "${headers.server ?? '-'}", x-powered-by "${headers['x-powered-by'] ?? '-'}"`);
    expect(missing, 'Missing security headers').toEqual([]);
  });

  test(tc(4).title, tc(4).details, async ({ flowPage: page, stepLog }) => {
    let status: number | undefined;
    const dialogs = await dialogsDuring(page, async () => {
      status = (await page.goto(url(security.xssQuery), { waitUntil: 'domcontentloaded' }))?.status();
    });
    const rendered = (await page.content()).includes('<script>alert(1)</script>');
    stepLog.actual(`HTTP ${status}; title "${await page.title()}"; alerts: ${dialogs.length ? dialogs.join(' | ') : 'none'}; payload in page: ${rendered}`);
    expect.soft(dialogs, 'Alerts').toEqual([]);
    expect(rendered, 'Payload rendered').toBe(false);
  });

  test(tc(5).title, tc(5).details, async ({ flowPage: page, stepLog }) => {
    let status: number | undefined;
    const dialogs = await dialogsDuring(page, async () => {
      status = (await page.goto(url(security.xssPath), { waitUntil: 'domcontentloaded' }))?.status();
    });
    const title = await page.title();
    stepLog.actual(`HTTP ${status}; title "${title}"; alerts: ${dialogs.length ? dialogs.join(' | ') : 'none'}`);
    expect.soft(dialogs, 'Alerts').toEqual([]);
    expect.soft(status, 'HTTP status').toBe(404);
    expect(title, '404 page').toMatch(negative.notFoundTitle);
  });

  test(tc(6).title, tc(6).details, async ({ flowPage: page, stepLog }) => {
    const status = (await page.goto(url(security.sqlPath), { waitUntil: 'domcontentloaded' }))?.status() ?? 0;
    const body = await page.locator('body').innerText().catch(() => '');
    const found = leaks(body);
    const safe = status === 404 || (status >= 400 && status < 500);
    stepLog.actual(`HTTP ${status}; title "${await page.title()}"; database errors or stack traces: ${found.length ? found.join(', ') : 'none'}`);
    expect.soft(found, 'Database errors or stack traces').toEqual([]);
    expect(safe, '404 or safe (4xx) error page').toBe(true);
  });

  test(tc(7).title, tc(7).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    await ensureAt(page, subindices.path, stepLog);
    await list.waitForLoaded();
    const dialogs = await dialogsDuring(page, async () => {
      await list.header.search(security.xssSearch);
      await list.header.searchInput.press('Enter');
    });
    const value = await list.header.searchInput.inputValue().catch(() => '(search box closed)');
    // Any <script> or element built from the payload, other than the text inside the input.
    const injected = await page.evaluate((payload) =>
      [...document.querySelectorAll('script')].some((s) => s.textContent?.includes("alert('xss')"))
      || document.body.innerHTML.includes(payload), security.xssSearch);
    stepLog.actual(`Typed ${security.xssSearch} + Enter → ${page.url()}; input value: "${value}"`);
    stepLog.actual(`Alerts: ${dialogs.length ? dialogs.join(' | ') : 'none'}; payload injected into the page: ${injected}`);
    expect.soft(dialogs, 'Alerts').toEqual([]);
    expect(injected, 'Payload injected as HTML').toBe(false);
  });

  test(tc(8).title, tc(8).details, async ({ flowPage: page, flowHomePage: home, flowSubindicesPage: list, stepLog }) => {
    // Next.js sends the page data to the browser as an RSC payload when navigating in the app.
    const payloads: { url: string; body: string }[] = [];
    const onResponse = async (r: Response) => {
      if (new URL(r.url()).pathname === subindices.path && r.url().includes('_rsc=')) {
        payloads.push({ url: r.url(), body: await r.text().catch(() => '') });
      }
    };
    page.on('response', onResponse);
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await home.header.navigate('India Macroeconomic Indices', 'Subindices');
      await page.waitForURL(/\/subindices$/);
      await list.waitForLoaded();
      await page.waitForTimeout(500);
    } finally {
      page.off('response', onResponse);
    }
    if (!payloads.length) {
      // Prefetched before the listener could see it: ask for the same payload directly.
      const r = await page.request.get(url(subindices.path), { headers: { RSC: '1' } });
      payloads.push({ url: `${r.url()} (RSC: 1)`, body: await r.text() });
    }
    const body = payloads.map((p) => p.body).join('\n');
    const found = Object.entries(security.dataLeakPatterns).filter(([, re]) => re.test(body)).map(([name, re]) => `${name}: "${body.match(re)?.[0]}"`);
    stepLog.actual(`Captured ${payloads.length} data response(s): ${payloads.map((p) => `${p.url} (${p.body.length} bytes)`).join(', ')}`);
    stepLog.actual(`Credentials, internal paths, emails or stack traces: ${found.length ? found.join('; ') : 'none found'}`);
    expect(found).toEqual([]);
  });

  test(tc(9).title, tc(9).details, async ({ flowPage: page, flowSubindicesPage: list, stepLog }) => {
    const readValues = async () => {
      await page.goto(subindices.path, { waitUntil: 'domcontentloaded' });
      await list.waitForLoaded();
      return Promise.all((await list.cards()).map((c) => c.badgeText()));
    };
    const before = await readValues();
    const accepted: string[] = [];
    for (const method of security.writeMethods) {
      const status = (await page.request.fetch(url(subindices.path), { method, data: { probe: 'qa-automation' } })).status();
      stepLog.actual(`${method} ${subindices.path} → HTTP ${status}`);
      if (!security.rejectedStatuses.includes(status)) accepted.push(`${method} → ${status}`);
    }
    const after = await readValues();
    stepLog.actual(`Card values before: ${before.join(', ')}; after: ${after.join(', ')}`);
    expect.soft(after, 'Data unchanged').toEqual(before);
    expect(accepted, 'Requests not rejected with 401/403/405').toEqual([]);
  });
});
