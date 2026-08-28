# Health Export Cleaner — repair handoff

## Status: PASS — repaired and deployed

Work order `health-export-cleaner-repair-5` repaired the release blocker in
independent report commit `47900f35f12d019d2e7da6f9d7bc7f39915349e0`
for candidate `0c87aa0267cd4e27197d19afad9b74cbf63c0c07`.
The product repair is commit `98e216d145cee68754a06136fd46c0c1ac5654d3`.

The exact production build was deployed on 2026-08-28 UTC to the configured
Azure Static Web App `sf-health-export-cleaner`. The custom domain is
<https://health-export-cleaner.sociobot.in>.

## Findings repaired

### HEC-QA5-1 — claims contract (release blocker)

- Expanded `.factory/claims.json` from 9 to 16 independently runnable claims.
  The new declarations cover no-account/no-install use, free MIT-licensed
  source, first-party-only runtime resources, CSV conventions, Apple Health
  XML scope, all minimization controls, and preference portability.
- Added one observable `@claim:<id>` Playwright test for every retained claim.
  Each starts from `/demo` in a fresh browser context and verifies the promised
  result, not just the presence of a control.
- Strengthened privacy coverage to inspect the IndexedDB value and confirm it
  contains only timestamp precision. The request test now begins before page
  navigation, exercises a complete download flow, and proves every runtime
  request/script/stylesheet is same-origin.
- Added `tests/claims.test.ts`. It rejects duplicate claim IDs, missing or
  duplicate test tags, undeclared tags, malformed test commands, and product or
  README claim markers that do not map to the contract.
- Marked claim-bearing landing copy with `data-claim` and README copy with
  `claim:<id>` comments. The verifier-cited promises remain visible and are now
  explicit contract surfaces.

### HEC-QA5-2 — immutable hashed assets (non-blocking medium)

- Vite now emits content-hashed application JS/CSS to `/compiled/`.
- Static Web Apps gives only `/compiled/*` a one-year immutable cache policy.
  Stable generated artwork under `/assets/*` remains at one-hour revalidation.
- Service-worker cache version `v6` discovers and precaches both compiled and
  stable assets. A browser regression checks the build paths and both policies.

The researched brief, local-first architecture, generated visual identity,
cleaning behavior, artifact class, and static deployment class are unchanged.

## Local verification

Run from the repository root:

```sh
npm ci
npm test
npm run lint
npm run build
npm run preview
```

Evidence from the clean repair tree:

- `npm ci`: 143 packages installed; 0 vulnerabilities.
- `npm test`: 24/24 Vitest tests and 27/27 Playwright tests passed.
- `npm run lint`: passed.
- `npm run build`: TypeScript and Vite passed; `dist/` was produced.
- Claims gate: all 16 exact commands from `.factory/claims.json` were run
  separately; 16/16 passed with exactly one matching test each.
- Built application payload: main JS 21.20 kB (7.99 kB gzip), preload JS
  0.71 kB (0.40 kB gzip), main CSS 15.86 kB (4.43 kB gzip), and the mobile
  hero WebP 47,268 bytes. All remain inside the product budgets.
- `/opt/fleet/lib/verify-url.sh` against local production preview: HTTP 200,
  558 ms navigation, no console/page errors, title and `lang` present, one
  `h1`, a `main`, no missing image alternatives, and no unlabeled buttons.
- Local Lighthouse 12.8.2 desktop audit: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.3 s, LCP 0.4 s, TBT 0 ms, CLS 0.

## Browser, accessibility, privacy, and PWA evidence

- Desktop 1366px and mobile 390×844 were visually reviewed from production
  screenshots. The 390px test has no horizontal overflow and verifies 44px
  navigation targets.
- Axe Playwright integration found zero serious/critical violations on the
  empty cleaner, configured cleaner, Privacy, and Terms. The keyboard-only
  path covers skip-link focus, sample loading, all controls, and ZIP download.
- Reduced motion remains explicitly handled. No autoplay, flashing, remote
  fonts, third-party scripts, analytics, or trackers are present.
- Privacy coverage uploads unique health values, records all network activity,
  inspects Cache Storage and IndexedDB, reloads, and confirms the values and
  filename were neither sent nor retained.
- Offline coverage installs the service worker, reloads `/demo` offline, and
  verifies the cleaner and sample remain usable. An uncached offline route gets
  the styled fallback without CSP-blocked inline CSS. The update toast and
  `skipWaiting` refresh flow pass.
- Package/consumer verification is not applicable: this is a static PWA, not a
  published package. API/rate-limit checks are not applicable because it has no
  backend, account, billing, or API endpoint.

## Deployment and live verification

Deployment used the repository's `dist/` and
`public/staticwebapp.config.json`:

```sh
swa deploy dist --env production --deployment-token "$repair_deploy_token"
```

The token was fetched at runtime from the configured Azure resource and was
not printed or stored in the repository.

- `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run
  test:e2e`: 27/27 passed, including all claims, mobile, keyboard, Axe, privacy,
  offline/update, metadata, 404, and cache regressions.
- All 24 deployed application files (excluding deployment-only
  `staticwebapp.config.json`) matched local `dist/` byte-for-byte by SHA-256.
- Live `verify-url.sh`: HTTP 200, 734 ms navigation, zero console/page errors,
  and all title/language/landmark/image/control checks passed.
- Live Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.2 s, LCP 0.3 s, TBT 0 ms, CLS 0.
- Hashed `/compiled/main-3nLrdEhL.js` returns
  `Cache-Control: public, max-age=31536000, immutable`. Stable hero artwork
  returns `public, max-age=3600, must-revalidate`.
- Live responses include HSTS, same-origin CSP, `nosniff`, frame denial,
  strict referrer policy, and restrictive permissions policy.
- `POST`, `PUT`, and `DELETE /` return 405; `OPTIONS /` returns 204. An unknown
  route returns HTTP 404 with the styled “This page is not on the bench” page.

## Known gaps / next steps

None. The app intentionally remains local-only and does not add accounts,
remote processing, tracking, payment, or AI features.
