# IMI Automation (Playwright + POM)

Page Object Model framework for https://indiamacroindicators.co.in/

## Structure

```
src/
  config/       env.ts (ENV=prod|staging → baseURL), timeouts.ts
  pages/        One class per page. All extend BasePage. index.ts re-exports them.
  components/   Pieces shared across pages (HeaderComponent, later Footer, Search…)
  fixtures/     Injects page objects into tests → `async ({ homePage }) => …`
  data/         Test data (slugs, expected titles). Never hard-code data in specs.
  utils/        Generic helpers (scrolling, console-error tracking…)
tests/
  smoke/        Fast, critical checks — tagged @smoke
  regression/   Wider coverage — tagged @regression
```

## Rules

1. **Locators live only in page/component classes.** Specs never call `page.locator(...)`.
2. **Specs import from `@fixtures`**, not `@playwright/test`.
3. **Assertions live in specs**, actions live in page objects.
4. Prefer `getByRole` / `getByText` over CSS classes (the site uses Tailwind classes that change often).
5. Shared UI (header, footer) is a **component**, composed into pages — not inherited.

## Adding a new page

1. Create `src/pages/AssetAllocatorPage.ts` extending `BasePage`, set `path`, add locators.
2. Export it from `src/pages/index.ts`.
3. Register a fixture in `src/fixtures/index.ts`.
4. Write the spec in `tests/smoke` or `tests/regression` and tag it.

## Running

```
npm test                    # all tests, all browsers
npm run test:smoke          # only @smoke
npm run test:regression     # only @regression
npm run test:chromium       # one browser
npm run test:headed         # watch it run
npm run test:ui             # Playwright UI mode
npm run report              # open last HTML report
npm run typecheck
ENV=staging npm test        # (PowerShell: $env:ENV="staging"; npm test)
```
