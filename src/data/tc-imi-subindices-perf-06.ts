import { stepHelper, type Step } from './steps';

/**
 * TC_IMI_SUBINDICES_PERF_06 — steps and expected results copied verbatim from the
 * "Subindices Automation Test Cases" sheet (Test Cases tab, case 6, Performance).
 */
export const testCase = {
  id: 'TC_IMI_SUBINDICES_PERF_06',
  title: 'Subindices performance',
  description: 'Verify performance across the Subindices end-to-end flow.',
  application: 'India Macro Indicators (IMI)',
  page: 'Subindices',
  precondition: 'Desktop browser (Chrome) with a network connection; the lighthouse package for step 9',
};

export const steps: Step[] = [
  /* 1 */ { step: 'Open the browser.', expected: 'The browser should be launched.' },
  /* 2 */ { step: 'Enter the India Macroeconomic Indicators website URL.', expected: 'The India Macroeconomic Indicators website Home page should be displayed.' },
  /* 3 */ { step: 'Click the India Macroeconomic Indices option in the Navbar.', expected: 'The India Macroeconomic Indices menu options should be displayed.' },
  /* 4 */ { step: 'Click the Subindices option.', expected: 'The Subindices page should be displayed with URL /subindices.' },
  /* 5 */ { step: 'Measure the Subindices page load time.', expected: 'The page should load in 3 seconds or less.' },
  /* 6 */ { step: 'Measure LCP and CLS for the page.', expected: 'LCP should be 2.5s or less and CLS 0.1 or less.' },
  /* 7 */ { step: 'Click the Show charts toggle and measure response time.', expected: 'Charts should hide/show within 1 second.' },
  /* 8 */ { step: 'Click a Know more link and measure detail page load time.', expected: 'The detail page should load in 3 seconds or less.' },
  /* 9 */ { step: 'Run a Lighthouse audit on the Subindices page.', expected: 'Performance score should be 75 or higher.' },
];

export const tc = stepHelper(steps);
