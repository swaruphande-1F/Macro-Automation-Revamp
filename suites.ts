/**
 * TEST SUITES — decide here which test cases each suite runs.
 *
 * Run a suite:   npm run suite -- <key>        e.g.  npm run suite -- subindices
 * (No key runs `master`.)  Check what a suite selects without running it:  npm run suite -- <key> --list
 *
 * Each entry in `testCases` is one of:
 *   - a test case ID, e.g. 'TC_IMI_SUBINDICES_E2E_01' (the ID in the spec's test.describe title)
 *   - the test.describe title of a spec without an ID, e.g. 'Home page'
 *   - a spec file name, e.g. 'homePage.spec.ts'
 * Use testCases: 'all' to run every spec.
 *
 * To add a test case to a suite, add its ID to that suite's list.
 * To add a suite, copy a block below and give it a new key and name.
 */
export type SuiteDefinition = { name: string; testCases: 'all' | string[] };

export const suites: Record<string, SuiteDefinition> = {
  master: {
    name: 'Master Suite',
    testCases: 'all',
  },

  regression: {
    name: 'Regression Suite',
    testCases: [
      'TC_IMI_HOME_E2E_01',
      'TC_IMI_SUBINDICES_E2E_01',
      'TC_IMI_SUBINDICES_E2E_02',
      'TC_IMI_SUBINDICES_E2E_03',
      'TC_IMI_SUBINDICES_SEC_04',
      'TC_IMI_SUBINDICES_COMPAT_05',
      'TC_IMI_SUBINDICES_PERF_06',
      'Economic Indicators',
    ],
  },

  subindices: {
    name: 'Subindices Suite',
    testCases: [
      'TC_IMI_SUBINDICES_E2E_01',
      'TC_IMI_SUBINDICES_E2E_02',
      'TC_IMI_SUBINDICES_E2E_03',
      'TC_IMI_SUBINDICES_SEC_04',
      'TC_IMI_SUBINDICES_COMPAT_05',
      'TC_IMI_SUBINDICES_PERF_06',
    ],
  },

  smoke: {
    name: 'Smoke Suite',
    testCases: [
      'Home page',
    ],
  },
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Regex that selects the suite's test cases (undefined = everything). */
export function suiteGrep(suite: SuiteDefinition): RegExp | undefined {
  if (suite.testCases === 'all') return undefined;
  // Whole-word match, so TC_..._E2E_01 does not also pick up TC_..._E2E_010.
  return new RegExp(`(?<![\\w])(?:${suite.testCases.map(escapeRegExp).join('|')})(?![\\w])`);
}

/** The suite chosen with SUITE=<key> (set by `npm run suite`), or undefined for a normal run. */
export function activeSuite(): (SuiteDefinition & { key: string }) | undefined {
  const key = process.env.SUITE?.trim().toLowerCase();
  if (!key) return undefined;
  const suite = suites[key];
  if (!suite) throw new Error(`Unknown suite "${key}". Suites in suites.ts: ${Object.keys(suites).join(', ')}`);
  return { key, ...suite };
}
