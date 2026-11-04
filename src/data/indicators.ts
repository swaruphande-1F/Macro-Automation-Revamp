/** Test data lives here, never inside specs. */

export const categories = [
  { slug: 'economic-growth', title: 'Economic Growth' },
  { slug: 'inflation', title: 'Inflation' },
  { slug: 'monetary-policy-interest-rates', title: 'Monetary Policy & Interest Rates' },
  { slug: 'fixed-income', title: 'Fixed Income' },
  { slug: 'banking-credit', title: 'Banking & Credit' },
  { slug: 'equity-markets', title: 'Equity Markets' },
  { slug: 'trade-currency', title: 'Trade & Currency' },
  { slug: 'government-finances', title: 'Government Finances' },
  { slug: 'agriculture', title: 'Agriculture' },
  { slug: 'consumption-demand', title: 'Consumption & Demand' },
  { slug: 'jobs-employment', title: 'Jobs & Employment' },
  { slug: 'other-indicators', title: 'Other Indicators' },
] as const;

export const keyIndicators = [
  { slug: 'repo-rate', heading: 'Repo Rate' },
  { slug: 'real-gdp-growth', heading: /GDP/i },
  { slug: 'nifty-50', heading: /Nifty/i },
] as const;
