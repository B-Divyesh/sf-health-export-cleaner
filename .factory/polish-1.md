# Polish round 1 — finding closure

Candidate `bb238b060f54c99d7bc26652a4a60873cefa6e54` was repaired against
adversarial report `0da1d286d8a49ccf076b59ede42fdd3d97a711a7`. The repository contains
one review report (`review-1.md`) and no earlier `polish-*.md` files. All 16
findings are closed in deployed artifact commit
`b97bf12f848f55b8e5f12b7e710dd6ce6201d192`.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced “safest default” with “day only.” | `visitor claims contract > keeps every adversarial review wording repair literal`; `@claim:sample-demo`; [.factory/evidence/polish-1-demo-mobile.png](evidence/polish-1-demo-mobile.png); live `/demo` passed. |
| F-1-2 | Reworded the toast to “An update is ready” and registered `update-ready`. | `@claim:update-ready announces and activates an available service-worker update`; live suite passed at `/`; live build `main-BIgD7EQA.js`. |
| F-1-3 | Removed the unsupported README sentence about runtime keys/services. | `visitor claims contract > keeps every adversarial review wording repair literal`; clean-clone claim contract passed; live runtime/network claim passed. |
| F-1-4 | Registered `designed-404` and tagged the hosting/404 test. | `@claim:designed-404`; [.factory/evidence/polish-1-404-desktop.png](evidence/polish-1-404-desktop.png); cold live unknown route returned HTTP 404. |
| F-1-5 | Added shared route focus and polite announcements for legal, 404, back, and forward navigation. | `uses shared route chrome and restores heading focus through Privacy, Terms, back, forward, and 404`; [.factory/evidence/polish-1-privacy-mobile.png](evidence/polish-1-privacy-mobile.png); live route suite passed. |
| F-1-6 | Unified the full wordmark, Demo/Privacy/Terms navigation, Local only badge, footer one-liner, legal links, maker, and v1.0.3 build ID. | Shared-route-chrome test above; [desktop home](evidence/polish-1-home-desktop.png), [mobile legal](evidence/polish-1-privacy-mobile.png), and [404](evidence/polish-1-404-desktop.png); live route suite passed. |
| F-1-7 | Renamed the repository link to “Source code on GitHub (external site).” | `@claim:free-source`; home and legal screenshots above; live `/demo` passed. |
| F-1-8 | Standardized the result as “cleaned copy”; ZIP/container language is limited to “download ZIP”; renamed the download and note files. | `@claim:clean-package`, `@claim:minimization-controls`, and wording regression test; [demo mobile](evidence/polish-1-demo-mobile.png); live download inspection passed. |
| F-1-9 | Replaced every user-facing “date boundary” with “date range.” | Wording regression test and `@claim:minimization-controls`; [demo mobile](evidence/polish-1-demo-mobile.png); live suite passed. |
| F-1-10 | Replaced “provenance” with “file details and risk note” in UI, README, Terms, note heading, and filename. | `@claim:clean-package` inspects `health-export-cleaned-file-details-and-risk.txt`; wording regression test; live download passed. |
| F-1-11 | Rewrote the parser explanation using concrete broken-file, size, and record-limit language. | Wording regression test and `@claim:strict-parser`; live `/demo` parser flow passed. |
| F-1-12 | Replaced the declaration error with a plain recovery action. | `@claim:strict-parser` exact-text assertion; [declaration error](evidence/polish-1-declaration-error.png); live parser suite passed. |
| F-1-13 | Renamed “Start for real” to “Clean my own file” and made exit delete the demo database before opening an empty cleaner. | `@claim:sample-demo` exercises `/demo`, `/?demo=1`, Reset, exit, empty state, and database deletion; [demo mobile](evidence/polish-1-demo-mobile.png); live claim passed. |
| F-1-14 | Added a recovery action to the header-only CSV error. | `@claim:strict-parser` exact-text assertion; [header-only error](evidence/polish-1-header-only-error.png); live parser suite passed. |
| F-1-15 | Replaced the missing-HealthData error with a plain recovery action. | `@claim:strict-parser` exact-text assertion; [missing data error](evidence/polish-1-missing-health-data-error.png); live parser suite passed. |
| F-1-16 | Replaced “browser matrix” with “browser checks.” | Wording regression test; deployed README at repair commit; full live Chromium checks passed 28/28. |

## Cumulative verification

- Fresh clone of pushed commit: `npm ci` passed with 0 vulnerabilities; all
  18 `.factory/claims.json` commands passed individually.
- Local: `npm test` passed 31 unit/contract tests and 28 Playwright tests;
  `npm run lint` and `npm run build` passed.
- Accessibility/privacy/offline: Playwright axe found no serious/critical
  violations; keyboard, focus, same-origin network interception, storage,
  offline reload, update, and reduced-motion checks passed.
- Local `verify-url.sh`: one h1, `lang=en`, main landmark, all image alt text,
  labeled buttons, and zero console/page errors. Evidence:
  [.factory/evidence/verify-local/verify.json](evidence/verify-local/verify.json).
- Live cold check: `/`, `/demo`, `/privacy/`, and `/terms/` returned 200; an
  unknown route returned 404; `verify-url.sh` reported zero errors. Evidence:
  [.factory/evidence/verify-live/verify.json](evidence/verify-live/verify.json).
- Full live Playwright suite: 28/28 passed against
  <https://health-export-cleaner.sociobot.in>.
- Live Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.05 s, CLS 0, TBT 48 ms. Evidence:
  [.factory/evidence/lighthouse-live.json](evidence/lighthouse-live.json).

No finding remains open.
