# Health Export Cleaner — repair handoff

## Status: PASS — deployed

Repair artifact: `be0518ffd7648f83f13058d58f9b1f30611e6266` on `main`.

Deployed on 2026-08-28 UTC with Azure Static Web Apps CLI to the configured
production app `sf-health-export-cleaner`. The configured custom domain,
<https://health-export-cleaner.sociobot.in>, served the repair immediately.
All 24 deployed application files (excluding deployment-only
`staticwebapp.config.json`) matched the local `dist/` byte-for-byte by
SHA-256.

## Fixed verifier findings

1. **HEC-QA4-1:** Reduced desktop hero padding, type scale, gap, and column
   pressure so the sample action, its explanation, and all three facts fit
   within a cold 1366×768 viewport. A Playwright regression asserts each
   element stays wholly in that viewport; 390×844 remains covered.
2. **HEC-QA4-2:** Package entries and download names are now neutral:
   `health-export-cleaned-package.zip`, `health-export-cleaned.csv`, and
   `health-export-cleaned-provenance.txt`. The provenance note deliberately
   omits the uploaded filename. Regression coverage uploads `Jane Doe personal
   health.csv` and checks every shared artifact for that disclosure.
3. **HEC-QA4-3:** Added three claimed, sandbox-tested behaviors to
   `.factory/claims.json`: the 100 MB/500,000-record limits, exact removal
   receipt counts, and malformed CSV/unrelated XML rejection. The claim-tag
   audit has nine IDs with exactly one matching test each.
4. **HEC-QA4-4:** Moved fallback styles to same-origin `offline.css`, precache
   it, bumped the service-worker cache version, and return `offline.html` for
   an uncached offline navigation instead of cached `/`. The browser regression
   covers the actual fallback title, heading, and no-inline-style condition.
5. **HEC-QA4-5 to HEC-QA4-7:** Added canonical, Open Graph, Twitter, and Apple
   touch metadata to every route; added the original-art 1200×630 social crop;
   completed the footer identity/provenance; completed the landing copy audit;
   and changed stable image caching to `max-age=3600, must-revalidate` rather
   than immutable one-year caching.

The social crop derives from the existing reviewed `sorting-bench` generation;
its provenance is recorded in `.factory/design.md`.

## Verification

Clean install and repository gates:

```sh
npm ci                 # 143 packages, 0 vulnerabilities
npm test               # 21 Vitest + 21 Playwright tests pass
npm run lint           # pass
npm run build          # pass; emits ./dist
```

Each exact command in `.factory/claims.json` was run separately from the
current tree and passed: `sample-demo`, `supported-sources`,
`local-processing`, `offline-reload`, `identifier-removal`, `clean-package`,
`safety-limits`, `removal-receipt`, and `strict-parser`.

Browser and accessibility:

- Local and live Playwright suites: **21/21 pass**; this includes desktop,
  390px mobile, keyboard-only download, reduced-motion behavior, privacy
  request/storage checks, offline reload/fallback, update flow, and Axe
  serious/critical checks on home, configured cleaner, Privacy, and Terms.
- `/opt/fleet/lib/verify-url.sh https://health-export-cleaner.sociobot.in/ …`:
  HTTPS 200; 568 ms navigation; no console/page errors; title, `lang`, one
  `h1`, `main`, image alternatives, and labelled controls all pass.
- The repository's Playwright Axe integration reported zero serious/critical
  violations. The standalone `@axe-core/cli` could not start its Selenium
  Chrome session in this container even when pointed at Playwright Chromium;
  the in-repo Playwright Axe run is the successful accessibility evidence.
- Local Lighthouse 12.8.2 mobile-profile: Performance **100**, Accessibility
  **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.4 s, TBT 20 ms,
  CLS 0. The runner emitted a post-audit browser-tab shutdown warning after
  writing those scores.

Live identity, privacy, and response policy:

- Production `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in
  npm run test:e2e` passed 21/21.
- Custom-domain headers include same-origin CSP, HSTS, `nosniff`, frame denial,
  Referrer-Policy, and restrictive Permissions-Policy. `/assets/*` now returns
  `Cache-Control: public, max-age=3600, must-revalidate`.
- `POST`, `PUT`, and `DELETE /` return 405; `OPTIONS /` returns 204. There is
  no backend, account, billing flow, or external runtime request surface.
- An unknown route returns the styled 404 body with HTTP 404. The live fallback
  uses `/offline.css` and the worker navigation failure branch selects
  `/offline.html`.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
npm run preview
```

Static deployment uses `dist/` and `public/staticwebapp.config.json`. The
repair was deployed with `swa deploy dist --env production` using the Azure
Static Web App deployment token retrieved from the configured `sociobot`
resource group; no token is stored in this repository.

## Known gaps / next steps

None. The app remains intentionally local-first and does not add any remote
processing, tracking, or account system.
