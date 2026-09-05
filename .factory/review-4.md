# Review health export cleaning — PASS

**Verdict: PASS — zero findings of every severity and zero untested public
claims.**

- Product: Health Export Cleaner
- Live URL: <https://health-export-cleaner.sociobot.in>
- Review date: 2026-09-05
- Implementation reviewed: `714134a8a37b265e1ad94b12d652c5fcdab9ddfb`
- Documentation reviewed: `1c00a90af4a189f2c3711a09d2d9b4195356d648`
- Current report-only base before this report: `9d58a0ebd828c323a16a5573f150f69259fd4d8c`

This is a static, browser-only PWA. It has no product API, account, tenant,
payment flow, or server-side product state. Backend tenant isolation, restart
persistence, health endpoint, and 429/`Retry-After` checks do not apply. As a
scope check, live `POST`, `PUT`, and `DELETE /` returned `405`; `OPTIONS /`
returned `204`.

## First screen and sample

Fresh, isolated Chromium contexts opened the live home page without scrolling
at 1440 × 900 and 390 × 844. Both made these answers visible:

- Job: clean a health export before sharing it.
- Audience: wearable users who need a cleaned copy without common identifiers
  or location details.
- First action: **Try it with sample data**, followed by **See a cleaned copy
  immediately.**

All three supporting facts were visible at both sizes: CSV and Apple Health XML
support, records staying in the browser tab, and offline use after the first
visit. Evidence screenshots are in
`/work/.evidence/review-4-live/desktop-first-screen.png` and
`/work/.evidence/review-4-live/phone-first-screen.png`.

One click loaded `sample-health-export.csv`, `3 rows kept`, and `3 fields
removed` in 835 ms on desktop and 748 ms on phone. The persistent label read
**Demo — sample data, nothing is saved** and exposed **Reset demo** and
**Clean my own file**. Reset restored the populated sample. The live demo
reset/exit race was repeated five times and preserved a seeded real preference
byte-for-byte while deleting the demo database.

## Claim commands

From a clean installed checkout, all 19 exact commands declared in
`.factory/claims.json` were run separately against the local production build.
Every command passed. The contract audit found all 19 declared IDs surfaced,
no unknown marker, no unmarked declaration, and exactly one matching browser
test tag per claim.

| Claim IDs | Result |
| --- | --- |
| `sample-demo`, `supported-sources`, `no-setup`, `free-source`, `first-party-runtime` | PASS |
| `local-processing`, `offline-reload`, `identifier-removal`, `minimization-controls`, `exact-timestamp` | PASS |
| `csv-conventions`, `apple-record-scope`, `clean-package`, `safety-limits`, `removal-receipt` | PASS |
| `strict-parser`, `preference-portability`, `update-ready`, `designed-404` | PASS |

Public privacy statements on the legal pages were also checked against the
same `local-processing` and `first-party-runtime` evidence. No extra public
promise was found without applicable claim coverage.

## Quality and runtime checks

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 143 packages installed; 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run build` | PASS; `dist/` emitted |
| `npm test` | PASS; 31 unit/contract + 29 browser checks |
| Live `npm run test:e2e` | PASS; 29/29 |
| Live `@claim:sample-demo --repeat-each=5` | PASS; 5/5 |
| Worker URL check | PASS; HTTPS 200, title, `lang`, one `h1`, `main`, alt text, labelled buttons, no console/page errors |
| Axe Playwright integration | PASS; zero serious or critical issues on empty/configured cleaner and Privacy/Terms; accessible-name diagnostic also passed |
| Local build/live artifact parity | PASS; 26/26 served artifacts matched SHA-256 |

The built main JavaScript is 25.80 kB raw / 9.52 kB gzip and main CSS is
16.15 kB raw / 4.52 kB gzip. No web fonts are shipped. The visual inspection
found no phone horizontal overflow. Keyboard coverage reached the skip link,
sample action, native file input, controls, and keyboard download with visible
3 px focus. Tests also cover reduced motion, invalid/recovery input, reversed
and empty boundaries, unsupported XML, CSV limits, offline reload, uncached
offline fallback, update activation, route focus, privacy/network requests,
and preference import/export.

Live `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html` have their expected
titles, one `h1`, and a `main`; all discovered product links and the labelled
GitHub link returned 200. An unknown address returned the styled page with
HTTP 404, as intended. `robots.txt` and `sitemap.xml` are present. Live headers
include enforcing same-origin CSP, `frame-ancestors 'none'`, `nosniff`, DENY
framing, restrictive permissions policy, and strict referrer policy. Hashed
`/compiled/*` assets are immutable for one year; stable artwork revalidates in
one hour; `sw.js` is no-store.

## Earlier findings and current disposition

Every earlier review and verification report was inspected. The following
records the current proof rather than relying on a prior report's status.

| Earlier finding | Current disposition and fresh proof |
| --- | --- |
| F-1-1 | Fixed: Day reads “day only”; no unsupported safest-default promise remains. |
| F-1-2 | Fixed: the update notice says “An update is ready”; `update-ready` passed. |
| F-1-3 | Fixed: the untested no-runtime-keys/services sentence is absent. |
| F-1-4 | Fixed: `designed-404` is declared and passed; live unknown route is styled HTTP 404. |
| F-1-5 | Fixed: Privacy, Terms, Back, Forward, and 404 move focus to the destination `h1` and announce route status. |
| F-1-6 | Fixed: home, legal pages, and 404 share wordmark, nav, local badge, footer, factory attribution, and build ID. |
| F-1-7 | Fixed: source link names GitHub as an external site. |
| F-1-8 | Fixed: visitor copy uses cleaned copy; ZIP is only its container. |
| F-1-9 | Fixed: the filtering term is consistently date range. |
| F-1-10 | Fixed: visitor copy says file details and risk note, not unexplained provenance. |
| F-1-11 | Fixed: parser copy uses concrete broken-file and limit language. |
| F-1-12 | Fixed: XML declaration error gives an export-again recovery action. |
| F-1-13 | Fixed: demo exit is Clean my own file and the demo namespace is discarded. |
| F-1-14 | Fixed: header-only CSV error states the next action. |
| F-1-15 | Fixed: missing-HealthData error states the next action. |
| F-1-16 | Fixed: README says browser checks, not browser matrix. |
| F-2-1 | Fixed: exact timestamp preservation is `exact-timestamp`, declared and passed against the shipped timestamp. |
| HEC-V2-1 | Fixed: camel, Pascal, spaced, dashed, underscored, and compact identifier variants are locked out; ZIP assertions passed. |
| HEC-V2-2 | Fixed: active date ranges exclude missing/invalid dates and receipt/ZIP counts prove this. |
| HEC-QA3-1 | Fixed: valid `claims.json` has 19 one-test claim entries. |
| HEC-QA3-2 | Fixed: `/demo` is a one-click isolated, realistic populated sample with persistent label and reset/exit controls. |
| HEC-QA3-3 | Fixed: deliberate unknown routes receive the styled HTTP 404. |
| HEC-QA4-1 | Fixed: desktop and phone first screens visibly contain the sample action and three facts. |
| HEC-QA4-2 | Fixed: ZIP members and download use neutral names and omit personal source filenames. |
| HEC-QA4-3 | Fixed: safety limits, receipt, strict parser, and later material promises are all declared/tested. |
| HEC-QA4-4 | Fixed: offline fallback uses external CSS and the service worker selects it for an uncached offline route. |
| HEC-QA4-5 | Fixed: every route has route metadata, social preview, icons, shared footer identity, provenance disclosure, and build ID. |
| HEC-QA4-6 | Fixed: `copy-audit.md` extracts landing/recovery copy with word counts and terminology. |
| HEC-QA4-7 | Fixed: stable artwork revalidates rather than receiving immutable caching. |
| HEC-QA5-1 | Fixed: contract marker audit and separate command run cover all current material visitor claims. |
| HEC-QA5-2 | Fixed: compiled content-hashed JS/CSS have one-year immutable caching; stable assets revalidate. |
| HEC-QA5-3 | Disposition: no product defect. Current deterministic size evidence and all required browser checks passed; no unsupported Lighthouse score is claimed here. |
| HEC-QA6-1 | Fixed: bounded structural XML parsing rejects 40,000 unclosed records in under 500 ms in the unit test. |
| HEC-QA6-2 | Fixed: incomplete XML and comment-shaped records are rejected by parser and browser recovery tests. |
| HEC-QA6-3 | Fixed: CSV text after a closing quote is rejected and the declared strict-parser test covers it. |
| F-3-1 | Fixed: the live five-run blocked reset/exit race keeps the seeded real preference byte-for-byte unchanged and removes demo storage. |
| Verification 7 | Rechecked: no new implementation finding; current live suite and artifact parity pass. |
| Verification 8 | Rechecked: its PASS result is independently reproduced by the commands and live checks above. |

## Evidence locations

- Worker URL evidence and fresh desktop/phone screenshots:
  `/work/.evidence/review-4-live/`
- This report: `.factory/review-4.md`
- Required evidence copy: `/work/.evidence/qa-report.md`
- Required result JSON: `/work/.evidence/qa-result.json`

**Final result: PASS — 0 findings, 0 untested claims.**
