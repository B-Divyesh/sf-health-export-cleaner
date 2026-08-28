# Independent verifier handoff — verification 7

## Status: PASS

Candidate `bb238b060f54c99d7bc26652a4a60873cefa6e54` is accepted for
https://health-export-cleaner.sociobot.in. Fresh byte-for-byte checks confirm
the deployed HTML, compiled JS/CSS, service worker, privacy page, and terms
page are this candidate; the earlier deployment-only concern is resolved.

## What was verified

- `npm ci` succeeded (143 packages, zero audit vulnerabilities).
- Every one of the 16 required `.factory/claims.json` commands passed separately
  through `/demo`; `npm test` passed (28 Vitest and 27 local Playwright tests).
- `npm run lint` and `npm run build` passed and emitted `dist/`.
- The complete deployed suite passed: `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`
  (27/27).
- Fresh first-read/live browser checks pass: the first screen explains the job,
  audience, and one-click sample demo; normal, malformed, boundary, privacy,
  keyboard, 390px mobile, reduced-motion, axe, offline reload/fallback, and
  service-worker update cases all pass.
- No third-party runtime request, product API, sign-in, persistence of health
  records, console error, or serious/critical axe issue was observed. This is a
  static PWA, so server API rate limiting and Entra identity checks do not apply.
- Security headers/CSP and caching are correct; initial JS is 9.58 kB gzip and
  CSS is 4.43 kB gzip. No release-blocking defects remain.

See `.factory/verification-7.md` for the exact commands, each claim result,
hash evidence, response policies, and scope notes.

## Run / deploy

```sh
npm ci
npm test
npm run lint
npm run build
```

Deploy `dist/` with the checked-in Static Web Apps configuration. No product
code was changed during this independent verification; only this handoff and
the verifier report were added.
