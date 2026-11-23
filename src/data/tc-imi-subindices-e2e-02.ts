import { stepHelper, type Step } from './steps';
import { subindexList } from './subindices';

/**
 * TC_IMI_SUBINDICES_E2E_02 — steps and expected results copied verbatim from the
 * "Subindices Automation Test Cases" sheet (Test Cases tab, case 2).
 */
export const testCase = {
  id: 'TC_IMI_SUBINDICES_E2E_02',
  title: 'Subindex detail pages, Show charts toggle and chart interactions',
  description: 'Verify all subindex detail page flows end-to-end: each of the 8 cards to its detail page and back with data consistency, the full detail page features, Show charts toggle state, and chart interactions on all cards.',
  application: 'India Macro Indicators (IMI)',
  page: 'Subindices and subindex detail pages',
  precondition: 'Desktop browser (Chrome) with a network connection',
};

/** The 13 steps repeated for each card, in sheet order. */
export const cardBlock = [
  'scroll', 'readValue', 'readOutlook', 'knowMore', 'tabTitle', 'heading', 'tabs',
  'phasePanel', 'compareValue', 'overviewTab', 'compareOutlook', 'lastUpdated', 'back',
] as const;

const cardSteps = (title: string, slug: string): Step[] => [
  { step: `Scroll to the ${title} card.`, expected: `The ${title} card should be visible with its icon, title, chart and Index Value badge.` },
  { step: 'Read and store the Index Value shown on the card.', expected: 'The Index Value should be a number with one decimal place.' },
  { step: 'Read and store the Near-term Outlook text on the card.', expected: 'The outlook text should not be empty.' },
  { step: 'Click the Know more link on the card.', expected: `The ${title} detail page should be displayed with URL /subindices/${slug}.` },
  { step: 'Verify the browser tab title.', expected: `The title should be "${title} | India Macro indicators".` },
  { step: 'Verify the page heading.', expected: `The heading should read "${title}".` },
  { step: 'Verify the section tabs.', expected: 'The tabs Chart, Overview, Description, Usability and Historical Events should be displayed.' },
  { step: 'Verify the Current Phase panel.', expected: 'Current Phase name, Index Value, Success rate and Summary should be displayed.' },
  { step: 'Compare the detail page Index Value with the stored card value.', expected: 'The detail page value rounded to one decimal should equal the card Index Value.' },
  { step: 'Click the Overview tab.', expected: 'The page should scroll to the Overview section with Recent Updates and Near-term Outlook.' },
  { step: 'Compare the Near-term Outlook with the stored card text.', expected: 'The card outlook text should match the first point of the detail page Near-term Outlook.' },
  { step: 'Verify the Last Updated and Source labels below the chart.', expected: 'Last Updated should show a date in DD Mon, YYYY format and Source should not be empty.' },
  { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed with all 8 cards and the Show charts toggle ON.' },
];

const hoverStep = (title: string): Step => ({
  step: `Hover over the last data point on the ${title} chart.`,
  expected: "A tooltip should be displayed and its value should equal the card's Index Value badge.",
});

export const steps: Step[] = [
  /* 1 */ { step: 'Open the browser.', expected: 'The browser should be launched.' },
  /* 2 */ { step: 'Enter the India Macroeconomic Indicators website URL.', expected: 'The India Macroeconomic Indicators website Home page should be displayed.' },
  /* 3 */ { step: 'Click the India Macroeconomic Indices option in the Navbar.', expected: 'The India Macroeconomic Indices menu options should be displayed.' },
  /* 4 */ { step: 'Click the Subindices option.', expected: 'The Subindices page should be displayed with URL /subindices.' },
  /* 5–108: 13 steps per card */ ...subindexList.flatMap(({ title, slug }) => cardSteps(title, slug)),
  /* 109 */ { step: 'Click the Know more link on the Services Sector Activity Index card.', expected: 'The Services Sector Activity Index detail page should be displayed.' },
  /* 110 */ { step: 'Verify the default chart view.', expected: "The 'Index' view should be selected and the chart should show 'Index Value (LHS)'." },
  /* 111 */ { step: "Click the 'Index with YoY GVA (Services)' option.", expected: 'The chart should update to show the Index with the YoY GVA (Services) series and a legend for both.' },
  /* 112 */ { step: "Click the 'Index' option.", expected: 'The chart should return to the Index-only view.' },
  /* 113 */ { step: 'Click the 1Y range button.', expected: 'The 1Y button should be active and the X-axis should cover the last 1 year.' },
  /* 114 */ { step: 'Click the 5Y range button.', expected: 'The 5Y button should be active and the X-axis should cover the last 5 years.' },
  /* 115 */ { step: 'Click the 10Y range button.', expected: "The 10Y button should be active and the label should read 'Range: 10 Years'." },
  /* 116 */ { step: 'Click the MAX range button.', expected: 'The MAX button should be active and the chart should show the full history.' },
  /* 117 */ { step: 'Hover over the last data point on the chart.', expected: 'A tooltip should show the latest date and an Index Value matching the Current Phase Index Value.' },
  /* 118 */ { step: 'Click the More on Interpretation link.', expected: 'The interpretation content should be displayed for the phases.' },
  /* 119 */ { step: 'Click the Description tab.', expected: "The page should scroll to 'What is the Services Sector Activity Index?' and 'What are its components?' with the list of High Frequency Indicators." },
  /* 120 */ { step: 'Click the Usability tab.', expected: 'The page should scroll to the Usability section.' },
  /* 121 */ { step: 'Click the Historical Events tab.', expected: 'The page should scroll to Historical Events with events in reverse chronological order (month, year, title, description).' },
  /* 122 */ { step: 'Click page 2 in the Historical Events pagination.', expected: 'Page 2 should be active and a different set of older events should be displayed.' },
  /* 123 */ { step: 'Click page 1 in the Historical Events pagination.', expected: 'Page 1 should be active and the first set of events should be displayed again.' },
  /* 124 */ { step: "Click 'Subindices' in the breadcrumb.", expected: 'The Subindices page should be displayed.' },
  /* 125 */ { step: 'Verify the toggle default state.', expected: 'The toggle should be ON and charts should be displayed.' },
  /* 126 */ { step: 'Click the Show charts toggle.', expected: 'The toggle should turn OFF and all charts should be hidden.' },
  /* 127 */ { step: 'Click the Know more link on the Consumer Inflation Index card.', expected: 'The Consumer Inflation Index detail page should be displayed.' },
  /* 128 */ { step: 'Click the browser Back button.', expected: 'The Subindices page should be displayed; record whether the toggle remains OFF or resets to ON and verify it matches the expected product behaviour.' },
  /* 129 */ { step: 'Refresh the page.', expected: 'The toggle should be ON (default) and charts should be displayed.' },
  /* 130 */ { step: 'Click the Show charts toggle 10 times quickly.', expected: 'The toggle should end ON and exactly one chart should be displayed per card.' },
  /* 131 */ { step: 'Press Tab until the toggle is focused and press Space.', expected: 'The toggle should turn OFF using the keyboard.' },
  /* 132 */ { step: 'Press Space again.', expected: 'The toggle should turn ON and charts should be displayed.' },
  /* 133 */ { step: 'Navigate to the Subindices page (Navbar > India Macroeconomic Indices > Subindices).', expected: 'The Subindices page should be displayed with 8 cards and the Show charts toggle ON.' },
  /* 134–141 */ ...subindexList.map(({ title }) => hoverStep(title)),
  /* 142 */ { step: 'Verify the X-axis labels on every chart.', expected: "Each chart should show start and end month labels in MMM 'YY format (e.g. Jan '26, Jul '26)." },
  /* 143 */ { step: 'Verify the Y-axis on every chart.', expected: 'The Y-axis range should include the plotted values and no line should be clipped.' },
];

/** First step of each per-card block: card i starts at cardBlockStart + i * cardBlock.length. */
export const cardBlockStart = 5;
/** First step of the per-card tooltip block (134–141). */
export const hoverStart = 134;

export const tc = stepHelper(steps);
