import { stepHelper, type Step } from './steps';

/**
 * TC_IMI_SUBINDICES_SEC_04 — steps and expected results copied verbatim from the
 * "Subindices Automation Test Cases" sheet (Test Cases tab, case 4, Security).
 */
export const testCase = {
  id: 'TC_IMI_SUBINDICES_SEC_04',
  title: 'Subindices security',
  description: 'Verify the security end-to-end flow on the Subindices page: HTTPS, XSS, SQL injection, headers and API exposure.',
  application: 'India Macro Indicators (IMI)',
  page: 'Subindices',
  precondition: 'Desktop browser (Chrome) with a network connection',
};

export const steps: Step[] = [
  /* 1 */ { step: 'Open the browser.', expected: 'The browser should be launched.' },
  /* 2 */ { step: 'Enter http://indiamacroindicators.co.in/subindices in the address bar.', expected: 'The page should redirect to HTTPS with a valid certificate.' },
  /* 3 */ { step: 'Verify the response headers of the page.', expected: 'Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options and X-Frame-Options/frame-ancestors should be present.' },
  /* 4 */ { step: 'Enter https://indiamacroindicators.co.in/subindices?q=<script>alert(1)</script> in the address bar.', expected: 'No alert should execute and the payload should not be rendered.' },
  /* 5 */ { step: 'Enter https://indiamacroindicators.co.in/subindices/%3Cimg%20src=x%20onerror=alert(1)%3E in the address bar.', expected: 'No script should execute and a 404 page should be displayed.' },
  /* 6 */ { step: "Enter https://indiamacroindicators.co.in/subindices/services-sector-activity-index' OR '1'='1 in the address bar.", expected: 'A 404 or safe error page should be displayed with no database error or stack trace.' },
  /* 7 */ { step: "Click the Search icon and type <script>alert('xss')</script>, then press Enter.", expected: 'No script should execute and the input should be treated as text.' },
  /* 8 */ { step: 'Capture the subindices data response from the Network log.', expected: 'Only display fields should be returned; no credentials, internal paths, emails or stack traces.' },
  /* 9 */ { step: 'Send POST, PUT and DELETE requests to the subindices data endpoint.', expected: 'Requests should be rejected with 401/403/405 and data should remain unchanged.' },
];

export const tc = stepHelper(steps);
