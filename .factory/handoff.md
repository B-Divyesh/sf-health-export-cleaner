# Health Export Cleaner — repair handoff

## Status: PASS

Release-blocking findings from independent verification report commit
`35c3264465798c93e1570b321ca21d1f075cb107` against candidate
`afa5b0078044fc0e5691b4626e5a0bc5a2d02ae7` were repaired, covered by exact
regressions, and deployed on 2026-08-28.

Live: <https://health-export-cleaner.sociobot.in>

## Finding resolution

- **HEC-V1:** camelCase and PascalCase boundaries are preserved during key
  normalization. Token and conservative compact-name rules now block common
  identifier, name, email, device, source, and location compounds. Coverage is
  parameterized across camelCase, PascalCase, spaced, dashed, underscored, and
  compact variants. The exact verifier CSV is exercised in both unit and
  browser tests; the downloaded ZIP is parsed and its CSV is proven to contain
  only `type,date,value`, with none of `P-123`, `S-456`, `R-789`, `Jane Doe`,
  `jane@example.test`, or the GPS value.
- **HEC-V2:** every field row now updates immediately between `Kept`, `Removed
  by you`, `Always removed`, and the selected day/hour/exact timestamp state.
  The removal receipt visibly lists every removed field name.
- **HEC-V3:** zero-output recovery now distinguishes no fields, no record
  types, no date matches, and an invalid date range, with the correct next step.
- **HEC-V4:** `/assets/*` is served with
  `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` is no-store and
  the manifest is short-lived/revalidated.
- **HEC-V5:** deployed responses enforce CSP including `frame-ancestors
  'none'`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS, `nosniff`, and
  referrer policy. `.webmanifest` is `application/manifest+json`; AVIF is
  `image/avif`.
- **HEC-V6:** the wordmark and all footer/legal links measure at least 44 × 44
  CSS px at 390 px.
- **HEC-V7:** the visible `H//` is included in the wordmark accessible name.
  The experimental `label-content-name-mismatch` Axe rule now passes.

The service-worker cache and manifest start URL were versioned to v2 so
installed clients receive the repair. The product brief, concrete-and-moss
visual thesis, local-only architecture, and already-passing behavior were
preserved.

## Reproduction and regression coverage

The pre-repair suite passed despite the defect (10 unit and 4 browser tests),
matching the independent report. New coverage raises this to 17 unit and 9
browser scenarios and directly checks:

- all required sensitive-field naming styles and the exact verifier aliases;
- actual ZIP member contents rather than only `isSensitiveField()`;
- live field-state, precision-state, removal-name, and no-fields copy;
- desktop and 390 × 844 mobile layout and target sizes;
- empty/configured/Privacy/Terms Axe scans and the experimental name rule;
- keyboard-only skip, form traversal, and download with visible focus;
- zero network requests after a sensitive upload and no sensitive Cache
  Storage/IndexedDB data;
- service-worker-controlled offline reload and cleaning;
- update discovery, in-app toast, `skipWaiting`, controller change, and reload.

## Clean local verification

Run:

```sh
npm ci
npm run lint
npm test
npm run build
```

Results on Node.js 22 / npm 10 / Chromium 1.58.2:

- clean install: 143 packages, 0 audit vulnerabilities;
- ESLint: pass, 0 errors;
- TypeScript: `tsc --noEmit` pass;
- Vitest: 17/17 pass;
- Playwright: 9/9 pass;
- production build: pass, with `dist/index.html` at the static root;
- package/consumer install and API/auth/rate-limit checks: not applicable to a
  static, browser-only PWA.

Production budgets:

- main JS: 19,782 bytes / 7.65 KB gzip (budget ≤200 KB);
- main CSS: 15,001 bytes / 4.28 KB gzip (budget ≤50 KB);
- mobile hero WebP: 47,268 bytes (budget ≤300 KB);
- no runtime fonts, third-party scripts, analytics, API, or payment code.

`/opt/fleet/lib/verify-url.sh` passed locally with HTTP 200, no console/page
errors, title, `lang="en"`, one `<h1>`, `<main>`, and complete image alt text.
Desktop and mobile screenshots were reviewed without overflow or visual
regression.

Local Lighthouse 12.8.2 mobile:

- Performance 100, Accessibility 100, Best Practices 100, SEO 100;
- FCP 0.9 s, LCP 1.4 s, CLS 0, TBT 70 ms, Speed Index 0.9 s.

## Deployment and live verification

Azure Static Web Apps deployment `5dc38946-648a-4334-834d-4ebb98992624`
completed successfully using:

```sh
/opt/fleet/lib/deploy-static.sh health-export-cleaner dist
```

The custom domain returned HTTPS 200. `/opt/fleet/lib/verify-url.sh` passed
live with no console/page errors. The complete 9-scenario Playwright matrix
also passed live using:

```sh
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
```

All 20 served production files matched local `dist/` byte-for-byte (20 matched,
0 mismatched; deployment configuration is consumed by Azure and is not a
served artifact). Representative SHA-256 hashes:

- `index.html`: `908939ee70953e0e6115f3711377861bf34280809c65d0220ec0ea0e08feba96`
- `assets/main-CaRT_T1Q.js`:
  `98fa8fc631019483b43ed7d325be626558ef2a660517362a63ea515032ab6a5a`
- `sw.js`: `676d33d7628a49c8d06cecce9cbab6d46a1a1d058973f2c606eeb84893b95e46`

Live Lighthouse 12.8.2 mobile:

- Performance 100, Accessibility 100, Best Practices 100, SEO 100;
- FCP 1.0 s, LCP 1.1 s, CLS 0, TBT 0 ms, Speed Index 1.0 s;
- total transfer 67 KiB.

## Known limits

- Detection remains intentionally name-based and cannot recognize arbitrary
  vendor labels or sensitive free text. The UI and provenance note retain the
  human-review warning and never claim anonymization.
- Apple Health XML support remains limited to `<Record>` elements; other
  structures are omitted with a visible warning.
- Parsing remains in-memory with the existing 100 MB / 500,000-record ceiling.

No release-blocking findings remain. No infra, billing, paid service, or
artifact/deployment-class changes were introduced.
