# Review 2 handoff

## Status

Review complete; product code was not modified. **FAIL**: F-2-1 remains, so
this product is not ready for acceptance. All F-1-1 through F-1-16 are
confirmed fixed. The complete evidence and copy audit are in
`.factory/review-2.md`.

## Review 2 verification

- Fresh 390 px and desktop browser contexts confirmed the first screen, demo,
  Reset, isolated storage, offline reload, route focus, metadata, links, 404,
  and visual identity.
- A clean clone at `0fcbfbca2222261405c3e005eb97e1b947ae6c10` completed every
  one of the 18 listed claim commands separately; the live Playwright suite
  passed 28/28.
- In that clone, `npm run lint`, `npm run test:unit` (31/31), and `npm run
  build` passed. `dist/` was emitted; main JavaScript is 9.27 kB gzip.

## What changed

- Rewrote the first-screen and workflow copy around one result term: “cleaned
  copy.” The container is a download ZIP; its companion text is “file details
  and risk note.” Date controls now consistently use “date range.”
- Strengthened the isolated sample path. `/demo` and `/?demo=1` load the sample
  in `demo:health-export-cleaner`, Reset restores it, and **Clean my own file**
  waits for writes, deletes the demo database, and opens an empty real cleaner.
- Added `update-ready` and `designed-404` to `.factory/claims.json`. There are
  18 claims, each with exactly one tagged observable test.
- Added real route focus and polite announcements. Privacy, Terms, 404, back,
  and forward focus the one h1. Every route now uses the same full wordmark,
  navigation, product one-liner, legal/external links, maker, and build ID.
- Replaced three parser errors with plain recovery actions and added exact-text
  unit/browser coverage.
- Preserved the brutalist concrete-and-moss visual system and responsive PWA.
  The catalog description is verb-first and 101 characters.

The finding-by-finding evidence map is in `.factory/polish-1.md`.

## Verification evidence

Run locally:

```sh
npm ci
npm run lint
npm test
npm run build
```

Results on 2026-08-28 UTC:

- `npm ci`: 143 packages, 0 vulnerabilities.
- `npm run lint`: passed.
- `npm test`: 31 unit/contract tests and 28 Playwright tests passed.
- `npm run build`: passed; `dist/` emitted. Main JS is 9.27 kB gzip and CSS is
  4.52 kB gzip, below the 200 kB / 50 kB budgets.
- Fresh clone of pushed artifact commit: every one of the 18 claim commands
  passed separately.
- Local and live `verify-url.sh`: passed with correct title, `lang=en`, one h1,
  main landmark, alt text, and no console/page errors.
- Accessibility: the installed `@axe-core/playwright` checks passed empty,
  configured, Privacy, and Terms states with zero serious/critical violations.
  The standalone axe CLI could not pair its downloaded ChromeDriver 152 with
  the required preinstalled Chromium 145, so the pinned Playwright integration
  was used as allowed by the accessibility baseline.
- Privacy/offline: same-origin-only request interception, no upload/persistence,
  isolated demo deletion, service-worker install/update, and offline demo reload
  all passed locally and live.
- Live Playwright: 28/28 passed against the production URL after deployment.
- Live routes: `/`, `/demo`, `/privacy/`, `/terms/` returned 200; an unknown
  route returned the styled page with HTTP 404.
- Live Lighthouse mobile: performance 100, accessibility 100, best practices
  100, SEO 100; LCP 1.05 s, CLS 0, TBT 48 ms.

Evidence files are under `.factory/evidence/`, including local/live verification
JSON, Lighthouse JSON, and desktop/mobile screenshots.

## Deployment

Built `dist/` was deployed through `/opt/fleet/lib/deploy-static.sh` to the
existing `sf-health-export-cleaner` Azure Static Web App. Deployment ID:
`ebea2199-7b6b-48b2-ac90-f3d2f2a7c976`. The custom domain reported `Ready`,
served `compiled/main-BIgD7EQA.js`, and passed cold verification.

## Known gaps and next steps

F-2-1: **“Exact — Keeps the source timestamp”** has no matching registered
claim or observable claim test. Add an `exact-timestamp` claim and fresh-demo
download assertion, or remove the option. Rerun that claim command and the
full suite before accepting the product.
