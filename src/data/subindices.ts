/** Expected content of /subindices and the /subindices/<slug> detail pages. */

export type Subindex = { title: string; slug: string };

/** All 8 subindices, in the order the cards appear on /subindices. */
export const subindexList: Subindex[] = [
  { title: 'Services Sector Activity Index', slug: 'services-sector-activity-index' },
  { title: 'Industrial Sector Performance Index', slug: 'industrial-sector-performance-index' },
  { title: 'Agriculture Output Index', slug: 'agriculture-output-index' },
  { title: 'Consumer Inflation Index', slug: 'consumer-inflation-index' },
  { title: 'Equity Market Optimism Index', slug: 'equity-market-optimism-index' },
  { title: 'Global Economic Impact Index', slug: 'global-economic-impact-index' },
  { title: 'Financial Sector Soundness Index', slug: 'financial-sector-soundness-index' },
  { title: 'Interest Rate Outlook Index', slug: 'interest-rate-outlook-index' },
];

export const subindexPath = (slug: string) => `/subindices/${slug}`;

/** Finds a subindex by title, e.g. subindex('Consumer Inflation Index'). */
export function subindex(title: string): Subindex {
  const s = subindexList.find((x) => x.title === title);
  if (!s) throw new Error(`Unknown subindex "${title}"`);
  return s;
}

export const subindices = {
  path: '/subindices',
  title: 'Subindices | India Macro indicators',
  heading: 'Subindices',
  subtitle: 'A broad set of indices offering granular insights across various facets of the Indian economy',
  cardCount: 8,
  /** Card Index Value badge: one decimal place. */
  badgeFormat: /^\d{1,3}\.\d$/,
  /** Values that must never be displayed on a card. */
  invalidValues: ['null', 'undefined', 'NaN'],
  /** Card chart x-axis labels, e.g. "Jan '26". */
  cardAxisLabel: /^[A-Z][a-z]{2} '\d{2}$/,
  /**
   * The Show charts toggle state after Back from a detail page.
   * Observed 20 Nov 2026: it resets to ON. Confirm with the product team.
   */
  toggleOnAfterBack: true,
  /** Clicks for the "click the toggle quickly" step. */
  rapidToggleClicks: 10,
};

export const subindexDetail = {
  /** Browser tab title is "<title> | India Macro indicators". */
  titleSuffix: ' | India Macro indicators',
  tabs: ['Chart', 'Overview', 'Description', 'Usability', 'Historical Events'],
  /** Last Updated date, e.g. "31 Oct, 2026". */
  lastUpdated: /^\d{1,2} [A-Z][a-z]{2}, \d{4}$/,
  indexOption: 'Index Value',
  indexLegend: 'Index Value (LHS)',
  /** Second chart view per subindex. The sheet calls the Services one "Index with YoY GVA (Services)". */
  comparison: {
    'services-sector-activity-index': {
      option: 'Index value with YoY Growth in GVA Services',
      legend: 'YoY Growth in GVA Services (RHS)',
    },
  } as Record<string, { option: string; legend: string }>,
  /** Range button → the label in the chart's "Showing: … • Range: …" line. */
  ranges: { '1Y': '1 Year', '5Y': '5 Years', '10Y': '10 Years', MAX: 'All' } as const,
  /** Phase bands listed in the More on Interpretation modal. */
  interpretation: ['0-25 = Recession', '25-50 = Weak Recovery / Sharp Slowdown'],
  /** At least this many Historical Events pages. */
  minEventPages: 2,
};

export type RangeButton = keyof typeof subindexDetail.ranges;

export const negative = {
  invalidPath: '/subindices/invalid-index',
  upperCasePath: '/SUBINDICES/',
  /** The site's 404 page links back with "Return home". */
  notFoundTitle: /Page Not Found/,
  homeLinkName: 'Return home',
  /** Chrome DevTools "Slow 3G" preset. */
  slow3G: { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8 },
  /** Skeleton loader markers (Tailwind's pulse animation or a "skeleton" class). */
  skeleton: '.animate-pulse, [class*="skeleton" i]',
  maxCls: 0.1,
};

export const security = {
  httpUrl: 'http://indiamacroindicators.co.in/subindices',
  requiredHeaders: ['strict-transport-security', 'content-security-policy', 'x-content-type-options'],
  /** Either header protects against framing. */
  framingHeader: 'x-frame-options',
  xssQuery: '/subindices?q=<script>alert(1)</script>',
  xssPath: '/subindices/%3Cimg%20src=x%20onerror=alert(1)%3E',
  sqlPath: "/subindices/services-sector-activity-index' OR '1'='1",
  xssSearch: "<script>alert('xss')</script>",
  /** Text that must never show up in an error page. */
  leakPatterns: [/\bat \S+ \(\S+:\d+:\d+\)/, /Traceback \(most recent call last\)/, /SQL syntax|SQLSTATE|ORA-\d{5}|pg_query/i],
  /** Signs of sensitive data in the payload sent to the browser. */
  dataLeakPatterns: {
    email: /[\w.+-]+@[\w-]+\.(?:com|in|org|net|io)\b/i,
    credential: /"(?:password|passwd|secret|api[_-]?key|access[_-]?token|private[_-]?key)"\s*:/i,
    internalPath: /[A-Z]:\\\\(?:Users|inetpub)|\/(?:home|var|srv|opt)\/[\w-]+\//,
    stackTrace: /\bat \S+ \(\S+:\d+:\d+\)/,
  },
  /** The page URL serves the subindices data (server-rendered HTML and the RSC payload). */
  writeMethods: ['POST', 'PUT', 'DELETE'],
  rejectedStatuses: [401, 403, 405],
};

export const compatibility = {
  mobile: { width: 375, height: 812 },
  landscape: { width: 812, height: 375 },
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  /** Card grid columns per layout (Tailwind md:grid-cols-2 starts at 768px). */
  tabletColumns: 2,
  /** Other browsers for the journey: Playwright engines, and Edge through Chromium's msedge channel. */
  browsers: [
    { name: 'Chromium', engine: 'chromium' },
    { name: 'Firefox', engine: 'firefox' },
    { name: 'WebKit (Safari)', engine: 'webkit' },
    { name: 'Microsoft Edge', engine: 'chromium', channel: 'msedge' },
  ] as const,
};

export const performance = {
  loadBudgetMs: 3_000,
  maxLcpMs: 2_500,
  maxCls: 0.1,
  toggleBudgetMs: 1_000,
  detailLoadBudgetMs: 3_000,
  minLighthouseScore: 75,
};

export const search = {
  term: 'Agriculture Output Index',
  result: subindex('Agriculture Output Index'),
};
