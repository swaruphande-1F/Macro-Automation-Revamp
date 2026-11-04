/** Expected homepage content for TC_IMI_HOME_E2E_01. Values are formats, never hard-coded numbers. */

export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export const homeTitle = 'Indian Macroeconomic Indicators: Real-Time Economic Insights | IMI';

/** DOMContentLoaded budget for step 35 ("loads in under about 3 seconds"). */
export const loadBudgetMs = 3_000;

/** Third-party hosts whose console noise or failed requests are not the site's fault. */
export const thirdPartyNoise = [/google-analytics|googletagmanager|doubleclick|zoho|clarity|facebook/];

/** Browser warnings that are not page bugs, e.g. Firefox rejecting analytics cookies set for another domain. */
export const consoleNoise = [...thirdPartyNoise, /has been rejected for invalid domain/];

export const header = {
  /** Top-level items in the order the site shows them. */
  menus: ['India Macroeconomic Indices', 'Economic Indicators', 'Global Market P/E', 'Reports and Resources', 'Tools'],
  /** One sub-link per dropdown that the test clicks through. */
  dropdowns: [
    { menu: 'India Macroeconomic Indices', item: 'Subindices', url: /\/subindices$/ },
    { menu: 'Economic Indicators', item: 'Inflation', url: /\/economic-indicators\/category\/inflation/ },
    { menu: 'Tools', item: 'Asset Allocator', url: /\/asset-allocator/ },
  ],
} as const;

export const announcements = {
  calendar: { text: "India's Economic Calendar is now live", tag: 'Live Now', url: /\/india-economic-calendar/ },
};

export const hero = {
  heading: 'Real Time Macroeconomic Insights for Personal Finance',
  subtext: 'An extensive collection of macroeconomic indicators and tools to enable informed financial decision making',
  buttons: [
    { name: 'View All Indicators', url: /\/indias-economic-dashboard/ },
    { name: 'View Economic Calendar', url: /\/india-economic-calendar/ },
  ],
};

/** `maxAgeDays` overrides the frequency default for indicators that are released late. */
export const indicatorCards: { name: string; url: RegExp; frequency: Frequency; maxAgeDays?: number }[] = [
  { name: 'Real GDP Growth', url: /\/economic-indicators\/real-gdp-growth/, frequency: 'Quarterly' },
  { name: 'Repo Rate', url: /\/economic-indicators\/repo-rate/, frequency: 'Weekly' },
  { name: 'Consumer Price Index (CPI) Inflation', url: /\/economic-indicators\/consumer-price-index-cpi-inflation-headline/, frequency: 'Monthly' },
  { name: 'Debt-to-GDP Ratio', url: /\/key-economic-indicators\/debt-to-gdp-ratio/, frequency: 'Quarterly', maxAgeDays: 280 },
  { name: 'Foreign Exchange Reserves', url: /\/economic-indicators\/foreign-exchange-reserves/, frequency: 'Monthly' },
  { name: '10Y G-Sec Yield', url: /\/economic-indicators\/10y-g-sec-yield/, frequency: 'Daily' },
  { name: 'Nifty 50', url: /\/economic-indicators\/nifty-50/, frequency: 'Daily' },
  { name: 'Crude Oil Prices', url: /\/economic-indicators\/crude-oil-price-indian-basket/, frequency: 'Daily' },
];

/** Maximum days between the END of a card's period and today. */
export const maxAgeDays: Record<Frequency, number> = {
  Daily: 4,
  Weekly: 10,
  Monthly: 65,
  Quarterly: 155,
  Yearly: 400,
};

export const macroIndex = {
  url: /\/1-finance-macroeconomic-index/,
  series: [
    { tab: 'Index Value', legend: 'Index Value (LHS)' },
    { tab: 'YoY Growth in GDP', legend: 'YoY Growth in GDP (RHS)' },
  ],
  /** Range tab → text shown in the "Showing: … • Range: …" label. */
  ranges: { '1Y': '1 Year', '5Y': '5 Years', '10Y': '10 Years', MAX: 'All' },
  source: 'Source: CMIE Economic Outlook, 1 Finance Research',
};

export const assetAllocator = {
  url: /\/asset-allocator|portfolio-diversification/,
  ageGroups: ['Below 35 years', '36-45 years', '46-55 years', 'Above 55 years'],
  classes: ['Equity', 'Real Estate', 'Debt', 'Alternative Investments', 'Passive Income Assets'],
  roundingNote: 'Percentages may not total 100% due to rounding.',
};

export const correlation = {
  url: /asset-correlation/,
  size: 5,
};

export const reports = {
  tabs: ['Blogs', 'Monthly Updates', 'White Papers', 'Annual Reports'],
};

export const footer = {
  cin: /CIN No: U\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/,
  sections: ['Registered Office', 'Corporate Office', 'India Macro Indicators', 'Other Resources'],
  invalidEmail: 'not-an-email',
  invalidEmailError: 'Invalid email. Please use the format: example@domain.com',
  testEmail: 'qa.automation.test@example.com',
  /** Real endpoint — always mocked in tests so prod never gets a test subscriber. */
  subscribeApi: '**/api/newsletter/subscribe',
  appLinks: ['App Store', 'Google Store'],
  appLinkHost: /onelink\.me|play\.google\.com|apps\.apple\.com/,
};

export const mobileWidth = 375;
