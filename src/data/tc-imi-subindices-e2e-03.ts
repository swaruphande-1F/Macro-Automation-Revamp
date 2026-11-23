import { stepHelper, type Step } from './steps';
import { subindexList } from './subindices';

/**
 * TC_IMI_SUBINDICES_E2E_03 — steps and expected results copied verbatim from the
 * "Subindices Automation Test Cases" sheet (Test Cases tab, case 3).
 * The sheet's description also names negative scenarios (invalid URLs, API failure,
 * empty/null data, slow network, offline), but it lists no steps for them.
 */
export const testCase = {
  id: 'TC_IMI_SUBINDICES_E2E_03',
  title: 'Subindices global navigation and direct URL access',
  description: 'Verify global navigation, direct URL access to all subindex pages, and negative scenarios (invalid URLs, API failure, empty/null data, slow network, offline).',
  application: 'India Macro Indicators (IMI)',
  page: 'Subindices',
  precondition: 'Desktop browser (Chrome) with a network connection',
};

export const steps: Step[] = [
  /* 1 */ { step: 'Open the browser.', expected: 'The browser should be launched.' },
  /* 2 */ { step: 'Enter the India Macroeconomic Indicators website URL.', expected: 'The India Macroeconomic Indicators website Home page should be displayed.' },
  /* 3 */ { step: 'Click the India Macroeconomic Indices option in the Navbar.', expected: 'The India Macroeconomic Indices menu options should be displayed.' },
  /* 4 */ { step: 'Click the Subindices option.', expected: 'The Subindices page should be displayed with URL /subindices.' },
  /* 5 */ { step: 'Click the 1 Finance logo.', expected: 'The Home page should be displayed.' },
  /* 6 */ { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed.' },
  /* 7 */ { step: 'Click the Home icon in the breadcrumb.', expected: 'The Home page should be displayed.' },
  /* 8 */ { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed.' },
  /* 9 */ { step: 'Click the Search icon.', expected: 'The search input should be displayed.' },
  /* 10 */ { step: "Type 'Agriculture Output Index' in the search input.", expected: 'A matching search result should be displayed.' },
  /* 11 */ { step: 'Click the Agriculture Output Index result.', expected: 'The Agriculture Output Index page should be displayed.' },
  /* 12 */ { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed.' },
  /* 13 */ { step: 'Scroll to the footer.', expected: 'The footer should show CIN No, Registered Office, Corporate Office and footer link sections.' },
  /* 14 */ { step: "Click the 'Subindices' link in the footer.", expected: 'The Subindices page should be reloaded at the top.' },
  /* 15 */ { step: "Click the 'Economic Indicators' link in the footer.", expected: 'The Economic Indicators page should be displayed.' },
  /* 16 */ { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed.' },
  /* 17 */ { step: 'Click each remaining footer link and return with Back.', expected: 'Every footer link should open its page with HTTP 200 and Back should return to Subindices.' },
  /* 18 */ { step: 'Enter https://indiamacroindicators.co.in/subindices in the address bar.', expected: 'The Subindices page should be displayed with 8 cards.' },
  /* 19–26 */ ...subindexList.map(({ title, slug }) => ({
    step: `Enter https://indiamacroindicators.co.in/subindices/${slug} in the address bar.`,
    expected: `The ${title} detail page should be displayed with HTTP 200.`,
  })),
  /* 27 */ { step: 'Enter https://indiamacroindicators.co.in/subindices/invalid-index in the address bar.', expected: 'A 404 page should be displayed with a link back to Home.' },
  /* 28 */ { step: 'Click the Home link on the 404 page.', expected: 'The Home page should be displayed.' },
  /* 29 */ { step: 'Enter https://indiamacroindicators.co.in/SUBINDICES/ in the address bar.', expected: 'The Subindices page should be displayed or redirect to /subindices with no server error.' },
  /* 30 */ { step: 'Mock the subindices data request to return HTTP 500 and reload the page.', expected: 'A friendly error or empty state should be displayed; header, heading and footer should still be displayed.' },
  /* 31 */ { step: 'Mock the subindices data request to return an empty list and reload the page.', expected: "A 'no data' message should be displayed with no broken cards." },
  /* 32 */ { step: 'Mock one subindex with a null Index Value and empty chart data and reload the page.', expected: "That card should show '-'/'NA' and 'No data available' instead of null or a broken chart; other cards should be unaffected." },
  /* 33 */ { step: 'Remove the mocks, set network to Slow 3G and reload the page.', expected: 'Skeleton loaders should be displayed until data loads and the final layout should not shift.' },
  /* 34 */ { step: 'Set the browser offline and click any Know more link.', expected: 'An offline/friendly error should be displayed and the app should not crash.' },
  /* 35 */ { step: 'Set the browser online and reload the page.', expected: 'The Subindices page should load normally with 8 cards.' },
  /* 36 */ { step: 'Check the browser console and network logs for the whole flow (excluding mocked failures).', expected: 'No JavaScript errors or unexpected 4xx/5xx requests should be logged.' },
];

/** First step of the direct-URL block for each subindex (19–26). */
export const directUrlStart = 19;

export const tc = stepHelper(steps);
