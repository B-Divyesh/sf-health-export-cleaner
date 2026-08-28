# Health Export Cleaner — repair handoff

## Status: repaired and ready for static deployment

This repair addresses every release blocker in independent verification
`verification-3.md` for candidate `72ccbf9fb8450019b63aad4f40788ad25bb2b2f5`.
The researched brief, original local-first parser/export behavior, visual
system, and existing privacy boundary fixes are preserved.

## What changed

1. Added `.factory/claims.json` with six visitor-facing claims and exactly one
   Playwright test tagged `@claim:<id>` for each claim.
2. Added the true `/demo` sandbox. The first-screen **Try it with sample data**
   action opens it and immediately loads a realistic three-record wearable CSV.
   Its persistent banner exposes **Reset demo** and **Start for real**.
   Health records remain in memory; the one stored demo preference uses
   IndexedDB `demo:health-export-cleaner`, never the real
   `health-export-cleaner` database. Starting for real clears the demo
   preference. See `.factory/demo.md`.
3. Replaced the metaphorical hero with a plain job headline and an explicit
   wearable-user audience statement; the immediate sample outcome is stated
   next to the action.
4. Added a styled `404.html`, build entry, and regression test. The Static Web
   Apps configuration now has only the explicit `/demo → /index.html` rewrite;
   it no longer has a catch-all navigation fallback. Unknown paths therefore
   reach `responseOverrides.404`, which returns `404.html` with HTTP 404.
5. Updated the PWA cache version and precache list for `/demo` and `404.html`.

## Verification evidence

Executed from a clean `npm ci` install on 2026-08-28 UTC:

```sh
npm ci                                      # 143 packages; 0 vulnerabilities
npm test                                    # 20 unit + 14 Playwright passed
npm run lint                                # passed
npm run build                               # passed; dist/ at root
```

Each exact command from `.factory/claims.json` was run separately and passed:

```sh
npm run test:e2e -- --grep @claim:sample-demo
npm run test:e2e -- --grep @claim:supported-sources
npm run test:e2e -- --grep @claim:local-processing
npm run test:e2e -- --grep @claim:offline-reload
npm run test:e2e -- --grep @claim:identifier-removal
npm run test:e2e -- --grep @claim:clean-package
```

The browser suite covers desktop and 390×844 mobile, keyboard-only use and
visible focus, Axe serious/critical checks on empty/configured/legal pages,
demo namespace/reset, CSV/XML opening, direct-identifier removal, bounded
dates, privacy/no upload, offline reload, service-worker update, and the 404
deployment configuration. `verify-url.sh http://127.0.0.1:4173` passed title,
`lang`, one `h1`, `main`, alt text, labelled buttons, and no console errors
(550 ms local navigation). The built main JS is 20.80 kB (7.94 kB gzip) and CSS
is 15.77 kB (4.40 kB gzip), within budget.

The standalone `npx @axe-core/cli` was attempted and could not create its
Selenium Chrome session because the worker provides Playwright Chromium rather
than a system Chrome binary. The in-repository Playwright Axe integration
passed with zero serious/critical violations.

## Deploy

Deployed `dist/` as the existing **static** artifact class on 2026-08-28 UTC
using `/opt/fleet/lib/deploy-static.sh health-export-cleaner dist`. Azure Static
Web Apps deployment `3377f0f7-f3c6-4b46-83fa-b9e540c79d5d` succeeded and the
custom domain remains `https://health-export-cleaner.sociobot.in`.
`staticwebapp.config.json` is copied into `dist/` by Vite and contains the
required security headers, explicit `/demo` rewrite, cache rules, and 404
override. Live verification then passed:

```sh
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e  # 14 passed
curl -i https://health-export-cleaner.sociobot.in/missing-route                # 404
```

The live root contains the repaired headline, and the unknown route returns
HTTP 404 with the styled “This page is not on the bench” document.
