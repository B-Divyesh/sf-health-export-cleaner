# Independent verification 7 — PASS

**Candidate:** `bb238b060f54c99d7bc26652a4a60873cefa6e54` (`bb238b0`)

**Live URL:** https://health-export-cleaner.sociobot.in

**Verified:** 2026-08-28 UTC from a clean checkout. This report supersedes
the deployment-parity uncertainty recorded in verification 6.

## Release decision

**PASS.** The live static deployment matches the tested candidate and the
smallest useful product works end to end: it imports supported CSV/Apple Health
XML data locally, minimizes fields/types/dates/timestamps, previews the result,
and downloads a cleaned CSV plus provenance note. No release-blocking defect was
found.

## Cold first read

Fresh desktop Chromium loaded `/` with HTTP 200 and no console or page errors.
The first screen says **“Clean a health export before you share it.”** It says
this is for wearable users who need a smaller file without common identifiers
or location details. The clearly visible first action is **“Try it with sample
data”**, immediately explained as “See a cleaned sample export immediately.”
It also shows the three plain facts (CSV/XML support, browser-local records,
offline after first visit). The plain-words and one-click demo gates pass.

## Required claim contract

`.factory/claims.json` exists and declares 16 claims. After `npm ci` from this
checkout (143 packages; audit: 0 vulnerabilities), I ran every exact `test`
command listed in the file separately, each through the `/demo` entry point.
Every command passed (one Playwright test each):

| Claim ID | Result | Observable asserted by its claim test |
| --- | --- | --- |
| `sample-demo` | PASS | Isolated `demo:health-export-cleaner` preferences, banner, reset/start-real |
| `supported-sources` | PASS | CSV and Apple Health XML intake |
| `no-setup` | PASS | Account-free sample clean-package download |
| `free-source` | PASS | Free/MIT/source statement and no checkout UI |
| `first-party-runtime` | PASS | Same-origin-only complete demo flow; no API calls |
| `local-processing` | PASS | Uploaded unique values neither sent nor retained |
| `offline-reload` | PASS | Reloaded demo while offline after service-worker install |
| `identifier-removal` | PASS | Identifier/location fixture values excluded from ZIP CSV |
| `minimization-controls` | PASS | Date/type/field/hour choices applied to ZIP CSV |
| `csv-conventions` | PASS | `recorded_at`, date boundaries, missing date/type handling |
| `apple-record-scope` | PASS | Direct Apple `Record` import; unsupported sections omitted |
| `clean-package` | PASS | ZIP contains cleaned CSV and provenance note |
| `safety-limits` | PASS | 100 MB + 1 byte and 500,001-record inputs rejected |
| `removal-receipt` | PASS | Exact kept/omitted/removed-field receipt |
| `strict-parser` | PASS | Malformed quoted CSV and invalid/unrelated XML reject, then recover |
| `preference-portability` | PASS | Only timestamp precision is exported/imported |

`npm test` then passed in full: **28/28 Vitest** and **27/27 Playwright**.
The same full **27/27 deployed Playwright suite** passed with
`PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`.

## Product and boundary checks

- Representative demo clean/download passed. The deployed tests also exercised
  normal CSV/XML import, date/type/field/timestamp controls, ZIP content, and
  preference export/import.
- Invalid and recovery paths passed: unclosed/trailing-text quoted CSV,
  incomplete/comment-only/unrelated XML, 100 MB + 1 byte, 500,001 rows, empty
  output, and invalid date-boundary messaging.
- Parser limits and safety claims are covered locally and on the deployed demo.
- Privacy passed: a complete live demo flow requested only
  `https://health-export-cleaner.sociobot.in`; no XHR/fetch/websocket or
  third-party script/font/tracker was observed. Unique uploaded health values
  were absent from storage and after reload.
- This is a static local-first PWA with no product API or sign-in endpoint.
  Rate limiting and Entra tenant checks are therefore not applicable; no
  server-side product-unlock/API request exists to burst-test.

## Accessibility, UI, and PWA

- Independent live axe scans found **zero serious or critical violations** in
  empty and configured desktop states and configured 390×844 reduced-motion
  mobile state. The repository's full suite also covers legal pages.
- Live desktop and 390 px mobile had no horizontal overflow; configured mobile
  showed the download action. Keyboard checks passed for skip link, visible
  3 px focus outline, sample loading, tab navigation, and Enter download.
- The app has `lang=en`, a descriptive title, one `h1`, `main`, alt text,
  labels/live errors, semantic landmarks, and no observed console/page errors.
  Reduced motion resolves transitions/animations to `0.01ms`.
- Service-worker install, offline `/demo` reload, styled uncached offline
  fallback, update-available toast/refresh, manifest/icons, and 404 response
  all passed in the deployed Playwright suite.

## Deployment, policy, and performance evidence

- Live `/`, `/demo`, `/privacy/`, and `/terms/` returned 200; unknown route
  returned the styled `404.html` with HTTP 404. All manifest, icons, offline,
  robots, sitemap, and social-preview assets returned 200.
- Candidate parity is confirmed byte-for-byte for `index.html`, privacy, terms,
  compiled JS/CSS/module-preload files, and `sw.js`. Examples: live/local
  `index.html` SHA-256 =
  `0c760418a993b1b11f02430a61d9666fee94b00d7bcb5c78975257b01b7f6f6d`;
  `main-DEx0LcPX.js` =
  `1713e52e165e305ed032d4db3a9c5c3c795d45f3b43fff52524ccfbf1025c133`;
  `sw.js` =
  `9b10fa38a49c941795e6bea2467af1f971355e62e0f6173c98d9727c43612cd8`.
- Live headers include CSP limited to `self`, HSTS, `nosniff`, DENY framing,
  strict-origin referrer policy, restrictive permissions policy, appropriate
  MIME types, immutable caching for `/compiled/*`, revalidated assets, and
  no-store service worker caching.
- Production build passed with `dist/` emitted. Initial JS is 25.63 kB raw
  (9.58 kB gzip including module preload); main CSS is 15.86 kB raw/4.43 kB
  gzip; no web fonts are shipped. This is below the 200 kB JS/50 kB CSS budget.

## Quality commands

```sh
npm ci
npm test                 # PASS: 28 Vitest + 27 local Playwright
npm run lint             # PASS
npm run build            # PASS; emits dist/
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
                         # PASS: 27 deployed Playwright
```

## Defects

No critical, high, medium, or low product defects found. A standalone
Lighthouse binary was not preinstalled; performance was instead evidenced by
the production artifact sizes, header/cache inspection, responsive browser
checks, and the repository's axe/Playwright checks. This is a verification-tool
limitation, not a release-blocking product finding.
