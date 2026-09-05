# Health export cleaning verification 8 — PASS

**Verdict: PASS.** I found zero product findings and zero untested public
claims.

## Scope

- Product: Health Export Cleaner
- Live URL: <https://health-export-cleaner.sociobot.in>
- Implementation reviewed: `714134a8a37b265e1ad94b12d652c5fcdab9ddfb`
- Documentation reviewed: `1c00a90af4a189f2c3711a09d2d9b4195356d648`
- Verification date: 2026-09-05

This is a static, browser-only PWA. It has no product backend, tenant,
account, API, payment flow, or server-side product state. Tenant isolation,
restart persistence, health endpoints, and 429/`Retry-After` limits therefore
do not apply.

## First screen and sample

Fresh private desktop (1440 × 900) and phone (390 × 844) contexts opened the
live home page before scrolling. Both made these points clear:

- Job: clean a health export before sharing it.
- Audience: wearable users who need a cleaned copy without common identifiers
  or location details.
- First action: **Try it with sample data**; it says that a cleaned copy
  appears immediately.

The three facts were also visible: CSV and Apple Health XML support, local
browser handling, and offline use after the first visit. Evidence screenshots:
[`live-desktop-first-screen.png`](evidence/verification-8/live-desktop-first-screen.png)
and
[`live-mobile-first-screen.png`](evidence/verification-8/live-mobile-first-screen.png).

The one-click sample loaded three realistic health records, showed the source
name `sample-health-export.csv`, `3 rows kept`, and `3 fields removed`. The
persistent banner read **Demo — sample data, nothing is saved**. Reset restored
the sample and its Day preference. The registered demo claim seeded a real
preference, blocked demo IndexedDB deletion, raced Reset with exit, and proved
the real preference remained byte-for-byte unchanged while demo storage was
removed. That live race passed five times in a row.

## Claims

All 19 commands declared in `.factory/claims.json` were run separately from
the clean installed checkout against the production build. Every command
passed; no claim is missing a tagged browser test.

| Claim IDs | Result |
| --- | --- |
| `sample-demo`, `supported-sources`, `no-setup`, `free-source`, `first-party-runtime` | PASS |
| `local-processing`, `offline-reload`, `identifier-removal`, `minimization-controls`, `exact-timestamp` | PASS |
| `csv-conventions`, `apple-record-scope`, `clean-package`, `safety-limits`, `removal-receipt` | PASS |
| `strict-parser`, `preference-portability`, `update-ready`, `designed-404` | PASS |

Each was executed as `npm run test:e2e -- --grep @claim:<id>` with a fresh
browser context. The contract unit tests also confirmed that every public
claim marker in the pages and README maps to exactly one declared test.

## Quality checks

```text
npm ci                                                        PASS
npm run lint                                                  PASS
npm run build                                                 PASS; dist/ emitted
npm test                                                      PASS; 31 unit + 29 browser
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in \
  npm run test:e2e                                            PASS; 29/29 live
live @claim:sample-demo --repeat-each=5                       PASS; 5/5
```

The production output has 25.80 kB raw / 9.52 kB gzip main JavaScript and
16.15 kB raw / 4.52 kB gzip main CSS. No web fonts are shipped. All 26 served
files matched the local `dist/` candidate by SHA-256; the deployment-only
`staticwebapp.config.json` correctly returned 404 and was excluded.

The worker URL check passed with HTTPS 200, the expected title, `lang="en"`,
one `h1`, a `main` landmark, image alternatives, labelled buttons, and no page
or console errors. Its result is in
[`verify.json`](evidence/verification-8/verify-url/verify.json). The live
Playwright suite ran axe checks on empty/configured cleaner and legal pages
with zero serious or critical violations. The standalone axe CLI could not
launch this container's Playwright Chromium because it requires a system Chrome
and chromedriver; this did not leave accessibility untested because the pinned
Playwright axe integration ran successfully against the live site.

Fresh live browser coverage also passed for keyboard-only sample-to-download,
visible focus, desktop and 390 px layout, no horizontal overflow, reduced
motion, labels and live error recovery, privacy request/storage checks,
offline reload and fallback, service-worker update choice, route focus and
history, legal pages, metadata, links, manifest, and the designed HTTP 404.
All discovered internal and external links returned HTTP 200. `/`, `/demo`,
`/privacy/`, and `/terms/` returned 200; an unknown address returned the
styled 404 with HTTP 404.

Live response checks confirmed same-origin CSP, frame denial, HSTS, `nosniff`,
strict-origin referrer policy, restrictive permissions policy, immutable
compiled-asset caching, revalidated image caching, and no-store service-worker
caching. Full demo request capture found only same-origin requests, no
XHR/fetch/websocket activity, and no uploaded health values in browser storage
after reload.

Lighthouse evidence from the prior identical candidate reports 100 for
performance, accessibility, best practices, and SEO. I attempted a fresh
Lighthouse run with the available browser; its partial report recorded 99/100/
100/100 with FCP 1.0 s, LCP 1.1 s, TBT 130 ms, CLS 0, and 70 KiB transfer, but
the browser process crashed while saving a full-page screenshot. I do not use
that partial run as a quality result. The fresh build-to-live SHA comparison
establishes that the prior complete Lighthouse candidate is the same product
image.

## Earlier finding disposition

Every earlier review, verification, polish report, and handoff was read.
Current source, local tests, and the live deployment confirm the following
disposition.

| Earlier finding | Current disposition and proof |
| --- | --- |
| `HEC-V1`, `HEC-V2-1` | Fixed: common direct identifiers, device data, GPS, routes, and location are locked out; the downloaded CSV is inspected by `identifier-removal`. |
| `HEC-V2`, `HEC-V3` | Fixed: field states match output and the no-fields state gives the correct recovery action; `minimization-controls` covers both. |
| `HEC-V2-2` | Fixed: missing/unusable dates are excluded whenever a range is set; `csv-conventions` checks the boundary. |
| `HEC-QA3-1` through `HEC-QA3-3` | Fixed: the claims contract exists, the first-screen demo is isolated, and unknown URLs use a styled HTTP 404; all 19 claims plus `designed-404` passed. |
| `HEC-QA4-1` through `HEC-QA4-7` | Fixed: sample action is above the fold; archive names omit source filenames; public claims are mapped; offline fallback works under CSP; route metadata/footer are complete; copy audit is complete; only hashed compiled assets are immutable. |
| `HEC-QA5-1` through `HEC-QA5-3` | Fixed or not reproducible: claim mapping and compiled caching passed. A fresh complete Lighthouse run was prevented by verifier-browser instability, while the matching candidate has complete prior 100 evidence and the current partial metrics are within budget. |
| `HEC-QA6-1` through `HEC-QA6-3` | Fixed: malformed XML is rejected without text/comment matching or quadratic behavior, and strict CSV coverage matches the declaration; `strict-parser` and unit parser limits passed. |
| `F-1-1` through `F-1-16` | Fixed: literal wording contract passed; it covers the day label, update language, removed unsupported claims, route focus/chrome, external-link label, single output/date terminology, plain risk note, actionable parser errors, demo exit action, and README wording. |
| `F-2-1` | Fixed: Exact preserves `2026-08-20 08:12:41 +0000` in the cleaned CSV; the registered `exact-timestamp` claim passed. |
| `F-3-1` | Fixed: demo storage binds to its namespace for the document lifetime; blocked reset/exit waits safely. The seeded real preference was unchanged after the live race in 5/5 runs. |

No earlier finding remains open or regressed.

## Result

**PASS — zero findings of every severity and zero untested claims.**
