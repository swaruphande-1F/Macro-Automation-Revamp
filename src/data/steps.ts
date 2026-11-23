export type Step = { step: string; expected: string };

/**
 * Builds the `tc(n)` helper for a step-per-test case: title and details for `test()`.
 * The Expected result travels with the test as an annotation for the step reporter.
 */
export function stepHelper(steps: Step[]) {
  return (n: number) => {
    const s = steps[n - 1];
    if (!s) throw new Error(`No step ${n} (case has ${steps.length})`);
    return {
      title: `Step ${String(n).padStart(Math.max(2, String(steps.length).length), '0')}: ${s.step}`,
      details: { annotation: { type: 'Expected', description: s.expected } },
    };
  };
}
