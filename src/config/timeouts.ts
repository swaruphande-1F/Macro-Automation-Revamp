/** Shared timeouts (ms) so tests don't hard-code magic numbers. */
export const Timeouts = {
  short: 5_000,
  medium: 15_000,
  long: 30_000,
  pageLoad: 60_000,
} as const;
