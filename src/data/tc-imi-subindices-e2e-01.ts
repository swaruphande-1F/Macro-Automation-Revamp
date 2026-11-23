import { stepHelper, type Step } from './steps';
import { subindexList } from './subindices';

/**
 * TC_IMI_SUBINDICES_E2E_01 — steps and expected results copied verbatim from the
 * "Subindices Automation Test Cases" sheet (Test Cases tab, case 1).
 */
export const testCase = {
  id: 'TC_IMI_SUBINDICES_E2E_01',
  title: 'Subindices journey and all 8 subindex cards',
  description: 'Verify the complete Subindices journey and all 8 subindex cards: page load, heading, toggle charts, card order/fields/values/links, Know more and return.',
  application: 'India Macro Indicators (IMI)',
  page: 'Subindices',
  precondition: 'Desktop browser (Chrome) with a network connection',
};

const cardFields = (title: string, slug: string): Step => ({
  step: `Verify the ${title} card fields.`,
  expected: `Icon, title, chart, Index Value (number, 1 decimal, between 0 and 100), Near-term Outlook heading, sentiment icon, non-empty outlook text and a Know more link pointing to /subindices/${slug} should be displayed.`,
});

export const steps: Step[] = [
  /* 1 */ { step: 'Open the browser.', expected: 'The browser should be launched.' },
  /* 2 */ { step: 'Enter the India Macroeconomic Indicators website URL.', expected: 'The India Macroeconomic Indicators website Home page should be displayed.' },
  /* 3 */ { step: 'Click the India Macroeconomic Indices option in the Navbar.', expected: 'The India Macroeconomic Indices menu options should be displayed.' },
  /* 4 */ { step: 'Click the Subindices option.', expected: 'The Subindices page should be displayed with URL /subindices.' },
  /* 5 */ { step: 'Verify the breadcrumb.', expected: 'The breadcrumb should show the Home icon > Subindices.' },
  /* 6 */ { step: 'Verify the page heading.', expected: 'The heading should read "Subindices".' },
  /* 7 */ { step: 'Verify the subtitle.', expected: 'The subtitle should read "A broad set of indices offering granular insights across various facets of the Indian economy".' },
  /* 8 */ { step: 'Count the subindex cards.', expected: 'Exactly 8 subindex cards should be displayed.' },
  /* 9 */ { step: 'Verify the Show charts toggle default state.', expected: 'The toggle should be ON and every card should show a chart and Index Value badge.' },
  /* 10 */ { step: 'Click the Show charts toggle.', expected: 'The toggle should turn OFF and all 8 charts and Index Value badges should be hidden.' },
  /* 11 */ { step: 'Verify the cards with charts hidden.', expected: 'Each card should still show icon, title, Near-term Outlook with sentiment icon, outlook text and Know more.' },
  /* 12 */ { step: 'Click the Show charts toggle.', expected: 'The toggle should turn ON and all 8 charts should be displayed again.' },
  /* 13 */ { step: 'Click the Know more link on the Services Sector Activity Index card.', expected: 'The Services Sector Activity Index detail page should be displayed.' },
  /* 14 */ { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed.' },
  /* 15 */ { step: 'Click the Home icon in the breadcrumb.', expected: 'The Home page should be displayed.' },
  /* 16 */ { step: 'Navigate to the Subindices page (Navbar > India Macroeconomic Indices > Subindices).', expected: 'The Subindices page should be displayed with 8 cards and the Show charts toggle ON.' },
  /* 17 */ { step: 'Read the titles of all cards in page order.', expected: 'The titles should be in this order: Services Sector Activity Index; Industrial Sector Performance Index; Agriculture Output Index; Consumer Inflation Index; Equity Market Optimism Index; Global Economic Impact Index; Financial Sector Soundness Index; Interest Rate Outlook Index.' },
  /* 18–25 */ ...subindexList.map(({ title, slug }) => cardFields(title, slug)),
  /* 26 */ { step: 'Verify the card title links.', expected: 'Each card title should link to the same URL as its Know more link.' },
  /* 27 */ { step: 'Verify no card shows invalid values.', expected: "No card should display 'null', 'undefined', 'NaN' or an empty Index Value." },
];

/** First step number of the per-card "fields" block (18–25). */
export const cardFieldsStart = 18;

export const tc = stepHelper(steps);
