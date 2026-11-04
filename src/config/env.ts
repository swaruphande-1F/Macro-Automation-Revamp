/**
 * Central place for environment settings.
 * Pick the target with:  ENV=staging npx playwright test
 */
type EnvName = 'prod' | 'staging';

const environments: Record<EnvName, { baseURL: string }> = {
  prod: { baseURL: 'https://indiamacroindicators.co.in/' },
  staging: { baseURL: process.env.STAGING_URL ?? 'https://indiamacroindicators.co.in/' },
};

const name = (process.env.ENV ?? 'prod') as EnvName;

if (!environments[name]) {
  throw new Error(`Unknown ENV "${name}". Use one of: ${Object.keys(environments).join(', ')}`);
}

export const env = { name, ...environments[name] };
