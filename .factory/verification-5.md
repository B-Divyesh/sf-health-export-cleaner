# Independent verification 5 — FAIL

**Candidate:** `0c87aa0267cd4e27197d19afad9b74cbf63c0c07` (`main`)

**Live URL:** <https://health-export-cleaner.sociobot.in>

**Verified:** 2026-08-28 UTC from the supplied clean checkout.

## Release decision

**FAIL — do not release this candidate.** The deployed product is the tested
candidate and its core local-first cleaner, demo, declared claims, accessibility,
offline reload, and production build work. The factory claims contract is still
not satisfied: visitor-facing claims in the product and README are absent from
`.factory/claims.json`, so they do not have the required declared sandbox test.
The supplied claims skill makes an unlisted claim a failed review.

No product code was modified during this verification. This report and the
handoff are the only intended repository changes.

## Release-blocking finding

### HEC-QA5-1 — High — material claims are not all in the claims contract

The nine entries in `.factory/claims.json` are valid and tested, but they do
not cover every statement a visitor can rely on. Examples found in the live
landing page and README include:

- **“No account or installation required.”**
- **“Free, local, and inspectable.”**
- **“No third-party runtime scripts, fonts, analytics, or trackers are
  included.”**
- README source-format and behaviour promises beyond the listed claims, such
  as recognising `recorded_at`, treating a CSV without a type as one record
  type, and omitting Apple Health workouts/routes/clinical records.

Some are readily demonstrable and some have ordinary coverage, but none is a
declared `claims.json` item with the required one matching `@claim:<id>`
demo-sandbox test. This is a contract failure, not an assertion that the
observed implementation is false. Remediation is to either add a separately
declared observable test for each retained claim or remove/narrow the claim.

## Non-blocking findings

### HEC-QA5-2 — Medium — hashed application assets are not immutably cached

The live content-hashed JS and CSS files return
`Cache-Control: public, max-age=3600, must-revalidate`, rather than long-lived
immutable caching. The one-hour setting is safe and the service worker
precaches the shell, but it does not meet the PWA performance policy for
hashed assets. Stable, non-hashed hero files should remain revalidated; hash
application assets separately if the hosting configuration permits it.

### HEC-QA5-3 — Low — Lighthouse could not be run in this verifier image

Lighthouse 12.8.2 was attempted against production. Its launcher could not
connect to the supplied Playwright Chromium, so no fresh Lighthouse score is
claimed here. This does not invalidate the independent browser evidence below:
the initial JS is 21.20 kB (7.99 kB gzip), preload JS is 0.71 kB (0.40 kB
gzip), and CSS is 15.86 kB (4.43 kB gzip), all within the static-product
budgets.

## Mandatory claims gate

`.factory/claims.json` exists, has nine entries, and every ID occurs exactly
once as an `@claim:<id>` tag in `tests/e2e/app.spec.ts`. Before repository QA,
the claim command could not start because this clean checkout had not yet run
`npm ci` (`@playwright/test` was absent). After the locked clean install,
each listed command was run against the local production preview and the
combined independent run reported **9/9 passed**:

| Claim | Result |
| --- | --- |
| `sample-demo` | PASS |
| `supported-sources` | PASS |
| `local-processing` | PASS |
| `offline-reload` | PASS |
| `identifier-removal` | PASS |
| `clean-package` | PASS |
| `safety-limits` | PASS |
| `removal-receipt` | PASS |
| `strict-parser` | PASS |

The passing claim suite used `/demo`, exercised the realistic three-record
sample, verified the separate `demo:health-export-cleaner` IndexedDB namespace,
offline reload, no upload/persistence of unique health values, XML/CSV intake,
limits, identifier removal, receipt counts, ZIP entries, and recovery from
malformed input.

## Cold first-read and end-to-end result

The cold live first screen passes the plain-words/demo gate at both 1366×768
and 390×844:

- **What it does:** “Clean a health export before you share it.”
- **For whom:** wearable users needing a smaller file without common
  identifiers or location details.
- **What to click first:** visible **Try it with sample data**, with the
  immediate-result explanation beside/below it.

The direct `/demo` route immediately showed sample data and the persistent
**Demo — sample data, nothing is saved** banner, **Reset demo**, and **Start
for real**.

Independent representative and recovery coverage passed through the product's
unit/e2e suite and live browser suite: CSV and Apple Health XML ingestion,
date bounds, types, field removal, timestamp precision, disabled no-output
state, neutral ZIP/download names, malformed CSV/unrelated XML recovery, file
and record limits, local-only processing, and provenance output.

## Repository, deployment, PWA, privacy, and accessibility evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Candidate identity | PASS | `HEAD` was exactly `0c87aa0267cd4e27197d19afad9b74cbf63c0c07`. |
| Clean install | PASS | `npm ci`: 143 packages, 0 vulnerabilities. |
| Unit tests | PASS | `npm run test:unit`: 21/21 Vitest tests. |
| Lint/type/build | PASS | `npm run lint`; `npm run build` (`tsc --noEmit` + Vite) both passed and emitted `dist/`. |
| Full browser tests | PASS | Local `npm test` completed its 21-test Playwright suite; the live suite exercised the same 21 tests against the URL. |
| Live/candidate equality | PASS | SHA-256 equality for `index.html`, manifest, `sw.js`, main JS/CSS, and preload JS. |
| Desktop/mobile | PASS | 1366×768 and 390×844 screenshots; visible sample action, no 390px horizontal overflow, no console/page errors. |
| Keyboard/focus | PASS | Skip link focused first with a 3px moss outline; Enter moved focus to `main`. The browser suite also completes a keyboard-only download. |
| Reduced motion | PASS | Styles include a `prefers-reduced-motion: reduce` override that reduces animation/transition duration to .01ms. |
| Axe | PASS | Live home AxeBuilder: zero serious/critical violations. The repository suite also checks empty/configured home, Privacy, and Terms. |
| PWA/offline | PASS | Live `/demo` retained the sample after service-worker install, reload, and offline mode. An uncached offline route showed **The bench is still here**, `/offline.css`, no inline style, and no console error. |
| SW update | PASS | Repository browser coverage exercises the update toast and **Refresh now** flow. |
| Privacy/network | PASS | Cold live home made only same-origin document, JS, CSS, and image requests; CSP has `connect-src 'self'`; source audit found no runtime API/third-party call. The declared privacy test passed. |
| Response policy | PASS | HTTPS/HSTS, CSP, `nosniff`, `DENY` framing, strict referrer policy, restrictive permissions policy; unknown online route is HTTP 404. |
| Server/rate limiting | N/A | This is a static PWA with no product API, account, billing, or sign-in endpoint. `POST`/`PUT`/`DELETE /` return 405 and `OPTIONS /` 204; there is no endpoint for a meaningful 429 burst test. |

## Exact live header/cache record

The site returned a same-origin CSP:
`default-src 'self' ... connect-src 'self'; worker-src 'self'`, and static
routes `/`, `/demo`, `/privacy/`, `/terms/`, `/404.html`, manifest, service
worker, robots, and sitemap all returned 200. The online unknown route returned
HTTP 404. See HEC-QA5-2 for the only cache-policy concern.

## Required next step

Repair HEC-QA5-1, then run all declared claim commands from the demo entry
point again and re-verify the deploy. HEC-QA5-2 can be repaired in the same
deployment configuration change.
