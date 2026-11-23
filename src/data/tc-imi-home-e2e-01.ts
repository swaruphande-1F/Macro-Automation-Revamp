/**
 * TC_IMI_HOME_E2E_01 — steps and expected results copied verbatim from TC_IMI_HOME_E2E_01.md.
 * The spec creates one test per step from this list; the reporter prints Expected next to Actual.
 */
export const testCase = {
  id: 'TC_IMI_HOME_E2E_01',
  title: 'Homepage End-to-End Flow',
  application: 'India Macro Indicators (IMI)',
  page: 'Homepage',
  precondition: 'Desktop browser (Chrome) with cache cleared and a network connection',
};

export const steps: { step: string; expected: string }[] = [
  /* 1 */ { step: 'Open the URL', expected: 'The page loads with HTTP 200. The title is "Indian Macroeconomic Indicators: Real-Time Economic Insights | IMI". There are no console errors.' },
  /* 2 */ { step: 'Check the header', expected: 'The logo links to /. The menu shows 1 Finance Macroeconomic Index, Subindices, Economic Indicators, Global Market P/E, Reports and Resources and Tools.' },
  /* 3 */ { step: 'Hover over or click each menu item that has a dropdown', expected: 'Each dropdown opens with working sub-links.' },
  /* 4 */ { step: 'Check the announcement bar', expected: 'It shows "India\'s Economic Calendar is now live…" with a "Live Now" tag.' },
  /* 5 */ { step: 'Click the Next and Previous announcement arrows', expected: 'The announcements cycle without breaking the layout.' },
  /* 6 */ { step: 'Click the announcement link', expected: 'It goes to /india-economic-calendar. Go back.' },
  /* 7 */ { step: 'Check the hero section', expected: 'The heading reads "Real Time Macroeconomic Insights for Personal Finance", with the subtext and two buttons below it.' },
  /* 8 */ { step: 'Click View All Indicators', expected: 'It goes to /indias-economic-dashboard. Go back.' },
  /* 9 */ { step: 'Click View Economic Calendar', expected: 'It goes to /india-economic-calendar. Go back.' },
  /* 10 */ { step: 'Check all 8 indicator cards (Real GDP Growth, Repo Rate, CPI Inflation, Debt-to-GDP, Forex Reserves, 10Y G-Sec, Nifty 50, Crude Oil)', expected: 'Every card shows a value with its unit, the change since the base period, the base period, the frequency (Quarterly, Weekly, Monthly or Daily) and the last-updated date. No field is blank, NaN or undefined.' },
  /* 11 */ { step: "Check how fresh each card's last-updated date is", expected: 'Daily cards are within 1–2 working days of today. Weekly cards are within 7 days, monthly within the latest release cycle and quarterly within the latest quarter.' },
  /* 12 */ { step: 'Click each indicator card in turn', expected: 'Each opens its own page, for example /economic-indicators/real-gdp-growth, /economic-indicators/repo-rate, /key-economic-indicators/debt-to-gdp-ratio and /economic-indicators/crude-oil-price-indian-basket. Go back after each.' },
  /* 13 */ { step: 'Scroll to the 1 Finance Macroeconomic Index section', expected: 'It shows the current phase (for example "Transitory Slowdown"), the index value, the success rate and a summary.' },
  /* 14 */ { step: 'Click More on Interpretation', expected: 'The interpretation content opens or expands.' },
  /* 15 */ { step: 'Switch between the Index Value and YoY Growth in GDP tabs', expected: 'The chart redraws with the matching legend.' },
  /* 16 */ { step: 'Click each range: 1Y, 5Y, 10Y, MAX', expected: 'The x-axis range updates to match. The "Showing: … • Range: …" label updates too.' },
  /* 17 */ { step: 'Hover over points on the chart', expected: 'A tooltip shows the date and value.' },
  /* 18 */ { step: 'Click How to Embed this Chart?', expected: 'A modal or section with embed code opens and can be copied and closed.' },
  /* 19 */ { step: 'Check the chart footer', expected: 'It shows "Last Updated" and "Source: CMIE Economic Outlook, 1 Finance Research".' },
  /* 20 */ { step: 'Click the 1 Finance Macroeconomic Index heading link', expected: 'It goes to /1-finance-macroeconomic-index. Go back.' },
  /* 21 */ { step: 'In Asset Allocator, check the current phase', expected: 'It matches the phase in the Macro Index section (step 13).' },
  /* 22 */ { step: 'Select each age group: Below 35, 36–45, 46–55, Above 55', expected: 'The doughnut chart and percentages update for each one. The five classes are Equity, Real Estate, Debt, Alternative Investments and Passive Income Assets. The total is about 100%, with the rounding note shown.' },
  /* 23 */ { step: 'Click Know more under Asset Allocator', expected: 'It goes to the Asset Allocator page. Go back.' },
  /* 24 */ { step: 'Check the Correlation Analysis table', expected: "It's a 5×5 matrix with 1.00 on the diagonal. All values are between −1 and 1." },
  /* 25 */ { step: 'Click Know more under Correlation', expected: 'It goes to the relevant page. Go back.' },
  /* 26 */ { step: 'In Reports and Resources, switch between Blogs, Monthly Updates, White Papers and Annual Reports', expected: 'The cards update for each tab. Each card shows a title, category, date and read time, newest first.' },
  /* 27 */ { step: 'Click Read more on the first blog', expected: 'The blog page opens with the same title. Go back.' },
  /* 28 */ { step: 'Check the footer', expected: 'It shows the CIN number, registered office, corporate office and the link groups (India Macro Indicators and Other Resources).' },
  /* 29 */ { step: 'Click each footer link (Terms of Use, Privacy Policy, Sitemap, Authors and so on)', expected: 'Each opens a valid page with no 404. External links open in a new tab.' },
  /* 30 */ { step: 'Enter an invalid email in Newsletter Subscribe and submit', expected: 'A validation error is shown.' },
  /* 31 */ { step: 'Enter a valid test email and submit', expected: 'A success message is shown.' },
  /* 32 */ { step: 'Click Download the 1 Finance App', expected: 'It goes to the correct Play Store or App Store listing.' },
  /* 33 */ { step: 'Check the copyright line', expected: 'It shows "© Copyright 2026 indiamacroindicators.co.in", with the current year.' },
  /* 34 */ { step: 'Resize the window to mobile width (375px)', expected: "The layout is responsive, a hamburger menu works, the cards stack and there's no horizontal scroll." },
  /* 35 */ { step: 'Do a final check across the run', expected: 'No console errors and no failed network requests (4xx or 5xx). The page loads in under about 3 seconds.' },
];

/** Title and details for `test()`: the Expected result travels with the test as an annotation. */
export function tc(n: number) {
  const s = steps[n - 1];
  return {
    title: `Step ${String(n).padStart(2, '0')}: ${s.step}`,
    details: { annotation: { type: 'Expected', description: s.expected } },
  };
}
