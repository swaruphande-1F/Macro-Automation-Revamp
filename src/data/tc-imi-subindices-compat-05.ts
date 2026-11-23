import { stepHelper, type Step } from './steps';

/**
 * TC_IMI_SUBINDICES_COMPAT_05 — steps and expected results copied verbatim from the
 * "Subindices Automation Test Cases" sheet (Test Cases tab, case 5, Compatibility).
 */
export const testCase = {
  id: 'TC_IMI_SUBINDICES_COMPAT_05',
  title: 'Subindices on mobile, tablet and across browsers',
  description: 'Verify the complete Subindices journey on 375px mobile, 768px tablet and across Chrome, Firefox, Safari (WebKit) and Edge.',
  application: 'India Macro Indicators (IMI)',
  page: 'Subindices',
  precondition: 'Chromium drives the flow; Firefox, WebKit and Microsoft Edge must be installed for steps 15–18',
};

export const steps: Step[] = [
  /* 1 */ { step: 'Open the browser.', expected: 'The browser should be launched.' },
  /* 2 */ { step: 'Set the viewport to 375 x 812.', expected: 'The mobile layout should be displayed.' },
  /* 3 */ { step: 'Enter https://indiamacroindicators.co.in in the address bar.', expected: 'The Home page should be displayed.' },
  /* 4 */ { step: 'Tap the hamburger menu icon.', expected: 'The navigation drawer should be displayed.' },
  /* 5 */ { step: 'Tap India Macroeconomic Indices.', expected: 'The submenu should expand.' },
  /* 6 */ { step: 'Tap Subindices.', expected: 'The Subindices page should be displayed and the drawer should close.' },
  /* 7 */ { step: 'Verify the layout.', expected: 'Cards should be displayed in a single column with no horizontal scroll.' },
  /* 8 */ { step: 'Tap the Show charts toggle.', expected: 'Charts should be hidden.' },
  /* 9 */ { step: 'Tap the Show charts toggle again.', expected: 'Charts should be displayed.' },
  /* 10 */ { step: 'Tap the last data point on the first chart.', expected: 'A tooltip should be displayed.' },
  /* 11 */ { step: 'Tap the Know more link on the Interest Rate Outlook Index card.', expected: 'The Interest Rate Outlook Index detail page should be displayed in the mobile layout.' },
  /* 12 */ { step: 'Tap the browser Back button.', expected: 'The Subindices page should be displayed.' },
  /* 13 */ { step: 'Rotate to landscape.', expected: 'The layout should reflow with no clipped content.' },
  /* 14 */ { step: 'Set the viewport back to desktop size (1440 x 900).', expected: 'The desktop layout should be displayed.' },
  /* 15 */ { step: 'Run the end-to-end journey (load page, toggle charts off/on, open Know more, Back) on Chromium.', expected: 'All steps should pass.' },
  /* 16 */ { step: 'Run the same journey on Firefox.', expected: 'All steps should pass.' },
  /* 17 */ { step: 'Run the same journey on WebKit (Safari).', expected: 'All steps should pass.' },
  /* 18 */ { step: 'Run the same journey on Microsoft Edge.', expected: 'All steps should pass.' },
  /* 19 */ { step: 'Run the same journey at 768 x 1024 viewport.', expected: 'Cards should display in the tablet grid and all steps should pass.' },
];

/** First of the per-browser journey steps (15–18), in `compatibility.browsers` order. */
export const browserJourneyStart = 15;

export const tc = stepHelper(steps);
