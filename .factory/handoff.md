# Repair 7 handoff

## Status

**PASS candidate.** The reset/exit storage race from F-3-1 is fixed and no
known product finding remains. The deployed implementation is
`714134a8a37b265e1ad94b12d652c5fcdab9ddfb`. Static deployment
`44de14a3-3e37-4d2e-a9b4-ea5911d0c5bd` completed successfully at
<https://health-export-cleaner.sociobot.in>.

## What changed

- Preference storage now captures either `health-export-cleaner` or
  `demo:health-export-cleaner` once for the document lifetime. A demo document
  has no code path that can retarget its pending writes to the real database.
- Reset and exit suspend preference writes and cancel unfinished sample
  inspection. Exit waits for a running reset, deletes the demo database, and
  only then opens the normal cleaner.
- A blocked IndexedDB deletion stays in demo mode and announces that it is
  waiting for another demo tab. It never switches to the real namespace.
- `@claim:sample-demo` now seeds a uniquely marked real preference, holds the
  demo database open, races Reset with exit, and compares the real record after
  navigation. It also checks the ordinary reset result and demo deletion.
- Demo, README, claim, and copy-audit documentation now describe and cover the
  teardown behavior. New waiting messages remain within the plain-words limit.

## Finding disposition

- **F-3-1:** fixed at the namespace and operation-lifetime boundaries. The
  adversarial claim passed three repeated local runs and five repeated live
  runs. The real Exact preference and unique marker stayed byte-for-byte
  unchanged, while the demo database was removed.
- **F-2-1:** remains fixed. The registered Exact test downloads the CSV and
  verifies the source timestamp.
- **F-1-1 through F-1-16:** remain fixed. The current suite covers registered
  claims, shared route chrome and focus, plain terminology, actionable parser
  errors, external-link wording, update wording, and the styled 404.
- **Earlier verification findings:** identifier variants, date fail-closed
  behavior, malformed CSV/XML handling, parser limits, dynamic field states,
  neutral output names, offline fallback, route metadata, cache policy, touch
  targets, keyboard use, and reduced motion all retain passing regression
  coverage.

## Verification

The documented clean setup started with `npm ci`, which installed the lockfile
with zero reported vulnerabilities. Every one of the 19 commands in
`.factory/claims.json` ran separately and passed.

```text
npm run lint                                                    PASS
npm test                                                        PASS (31 unit/contract, 29 browser)
npm run build                                                   PASS; dist/ emitted
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in \
  npm run test:e2e                                              PASS (29/29)
live @claim:sample-demo --repeat-each=5                         PASS (5/5)
```

The production build contains 25.80 kB raw / 9.52 kB gzip main JavaScript and
16.15 kB raw / 4.52 kB gzip main CSS. No web fonts are shipped.

Post-deployment checks:

- All 26 served build files matched local `dist/` by SHA-256. The deployment
  configuration file was correctly excluded from served-file comparison.
- `verify-url.sh` found HTTPS 200, the expected title, `lang=en`, one `h1`, a
  main landmark, complete image alternatives, labelled buttons, and no console
  or page errors.
- Fresh 1440×900 desktop and 390×844 phone contexts showed the job, wearable
  audience, sample action, and three facts before scrolling. The one-click demo
  showed three realistic rows, three removed fields, and the persistent demo
  banner. Reset restored the sample and Day precision without a real preference
  value.
- The live browser suite covered Axe, keyboard, focus, 390 px layout, reduced
  motion, privacy requests/storage, offline reload and fallback, app updates,
  legal routes, links, titles, and the 404. All 29 checks passed.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100, FCP 1.0 s, LCP 1.1 s, TBT 10 ms, CLS 0, transfer 68 KiB.
- `/`, `/demo`, `/privacy/`, and `/terms/` return 200. An unknown route returns
  the designed page with HTTP 404. CSP, frame denial, HSTS, `nosniff`, referrer,
  permissions, MIME, and immutable compiled-asset headers are present.

Evidence is in `.factory/evidence/repair-7-live/`.

## Product scope and known gaps

This remains a static, browser-only PWA. It has no backend, tenant state,
account, payment flow, or product API, so SQLite persistence, restart behavior,
and 429/`Retry-After` checks do not apply. No AI feature is warranted for this
local data-minimization job. No external integration is required. Lab INP is
not available for a navigation-only Lighthouse run; TBT was 10 ms. No open
functional, privacy, accessibility, or deployment gap is known.
