# Independent verification 6 — FAIL

**Candidate:** `6a42d313e4ecb71ea3d89572a5a52b41986231bf`
(`main`)

**Live URL:** <https://health-export-cleaner.sociobot.in>

**Verified:** 2026-08-28 UTC from the supplied clean checkout.

## Release decision

**FAIL — do not release this candidate.** The clean build, all 16 declared
claim commands, full local and live browser suites, accessibility checks,
offline/update behavior, privacy checks, and deployment parity pass. Fresh
boundary testing found release-blocking parser defects, however: a small
malformed Apple XML file can block the main browser thread for many seconds,
invalid or commented XML is accepted as real health data, and malformed quoted
CSV syntax is silently repaired despite the declared strict-parser claim.

No product code was modified during this verification. This report and the
verification handoff are the only intended repository changes.

## Release-blocking findings

### HEC-QA6-1 — High — malformed Apple XML has quadratic main-thread parse duration

`parseHealthXml` uses a global regular expression whose non-self-closing
`<Record>` alternative scans forward for `</Record>`. Repeating unclosed
`<Record type="x">` tags makes each new match attempt rescan the remainder of
the input. The parser runs synchronously on the UI thread.

Fresh measurements against the exact candidate parser:

| Input | Size | Result |
| --- | ---: | --- |
| 40,000 unclosed `<Record>` tags | 680,012 bytes | Rejected only after 8,102 ms |
| 80,000 unclosed `<Record>` tags | 1,360,012 bytes | Still running when killed at 20 seconds |

Both files are tiny relative to the advertised 100 MB limit. A larger input
can freeze the tab for an impractical period, so the 100 MB / 500,000-record
limits do not defend the malformed-XML path. This violates the researched
brief's explicit requirement to defend XML/CSV parsing against large and
malformed files.

Reproduction from the repository root:

```sh
timeout 20s node --experimental-strip-types --input-type=module -e \
  "import {parseHealthXml} from './src/parser.ts'; \
   const s='<HealthData>'+('<Record type=\"x\">'.repeat(80000)); \
   parseHealthXml(s)"
```

The observed exit was `124` after 20 seconds for a 1,360,012-byte string.

### HEC-QA6-2 — High — XML text matching accepts invalid and commented records

The implementation is not a structural XML parser. On the live deployment:

- `<HealthData><Record .../>` with no closing `</HealthData>` was accepted as
  **Source ready**, reported one record, showed no error, and enabled download.
- `<HealthData><!-- <Record ... value="COMMENT-ONLY-SECRET"/> --></HealthData>`
  was also accepted as one record, and `COMMENT-ONLY-SECRET` appeared in the
  cleaned preview.

This can include content that XML semantics explicitly exclude and contradicts
the product's supported Apple Health XML scope and the brief's malformed-input
constraint. The parser must use bounded structural parsing and reject invalid
documents rather than extracting tag-shaped text.

### HEC-QA6-3 — Medium, release-blocking — declared strict CSV claim is broader than behavior

The declared claim says the parser “rejects malformed quoted CSV input.” The
test proves only an unclosed quote. The live parser accepted this invalid field:

```csv
type,date,value
HeartRate,2026-08-28,"72"trailing-junk
```

It reported **Source ready**, showed no error, and silently produced the value
`72trailing-junk`. RFC-style quoted fields may only be followed by a delimiter
or row ending. The observable claim is therefore false for an ordinary class
of malformed quoted input even though its narrowly selected claim test passes.

## Mandatory claims gate

`.factory/claims.json` exists with 16 entries. Before any other product QA,
`npm ci` completed from the clean candidate and every listed command was run
separately against the local production demo entry point. All passed:

| Claim | Result |
| --- | --- |
| `sample-demo` | PASS |
| `supported-sources` | PASS |
| `no-setup` | PASS |
| `free-source` | PASS |
| `first-party-runtime` | PASS |
| `local-processing` | PASS |
| `offline-reload` | PASS |
| `identifier-removal` | PASS |
| `minimization-controls` | PASS |
| `csv-conventions` | PASS |
| `apple-record-scope` | PASS |
| `clean-package` | PASS |
| `safety-limits` | PASS |
| `removal-receipt` | PASS |
| `strict-parser` | PASS, but insufficient; see HEC-QA6-3 |
| `preference-portability` | PASS |

`tests/claims.test.ts` also confirms unique claim IDs, exactly one matching test
tag per claim, no undeclared tags, valid commands, and claim-marker coverage.

## Cold first-read and demo result

The live page was opened in a fresh browser context before the broader QA. The
first screen passes the mandatory plain-words gate:

- **What it does:** “Clean a health export before you share it.”
- **For whom:** wearable users who need a smaller file without common
  identifiers or location details.
- **What to click first:** the visible **Try it with sample data** action,
  paired with “See a cleaned sample export immediately.”

One click opened `/demo`, immediately loaded three realistic wearable records,
and showed the persistent **Demo — sample data, nothing is saved** banner with
**Reset demo** and **Start for real**. All three privacy/source/offline facts
fit in both a 1366×768 first screen and the reviewed 390×844 mobile layout.

## Functional and recovery evidence

A fresh live end-to-end run uploaded a representative CSV containing two record
types, inclusive boundary dates, an undated row, direct identifiers, longitude,
and quoted text. It then exercised an invalid reversed date range and recovery,
selected one type, removed a field, reduced timestamps to the hour, and
downloaded the ZIP.

Observed result:

- reverse dates announced “The start date must be on or before the end date”
  and disabled download;
- recovery kept one row and reported one outside-range, one missing-date, and
  one excluded-type row;
- the package contained exactly `health-export-cleaned.csv` and
  `health-export-cleaned-provenance.txt`;
- output was the expected one row at `2026-08-21 09:00`;
- `patientId`, `longitude`, and the user-removed note were absent;
- provenance recorded the date range, precision, included/excluded types,
  removed fields, and all omission counts without retaining the source name.

Empty files, over-limit files, record 500,001, unclosed quoted CSV, unrelated
XML, no selected fields/types, and no matching dates have covered recovery
paths in the passing local and live suites. HEC-QA6-1 through HEC-QA6-3 document
the additional malformed cases those suites miss.

## Repository and build evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Candidate identity | PASS | Clean `HEAD` and `origin/main` were exactly `6a42d313e4ecb71ea3d89572a5a52b41986231bf`. |
| Install | PASS | `npm ci`: 143 packages, 0 vulnerabilities. |
| Full tests | PASS | `npm test`: 24/24 Vitest and 27/27 Playwright tests. |
| Lint | PASS | `npm run lint` completed with no findings. |
| Type/build | PASS | `npm run build` ran `tsc --noEmit` and Vite, producing `dist/`. |
| Live suite | PASS | `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`: 27/27. |
| Deployment parity | PASS | All 24 deployable `dist/` files matched live responses byte-for-byte by SHA-256; `staticwebapp.config.json` is deployment configuration and was excluded. |

Production payloads are comfortably inside budget: main JS 21,197 bytes
(7.99 kB gzip), module preload 711 bytes (0.40 kB gzip), main CSS 15,855
bytes (4.43 kB gzip), legal CSS 1,463 bytes, no web fonts, and mobile hero
47,268 bytes.

## Browser, accessibility, privacy, and PWA evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Desktop/mobile | PASS | Reviewed full-page 1366px and 390×844 layouts; no horizontal overflow. Every visible demo link, button, summary, and associated label measured at least 44×44 CSS px on mobile. |
| Keyboard/focus | PASS | Skip link is first, Enter focuses `main`, native controls and download complete keyboard-only, no trap; focus uses a visible 3px moss outline. |
| Axe | PASS | Fresh live Axe runs on `/`, configured cleaner, `/demo`, `/privacy/`, `/terms/`, and `/404.html`: zero serious/critical violations (zero violations total in the independent route run). |
| Semantics | PASS | `verify-url.sh`: HTTP 200, 776 ms load, title, `lang=en`, exactly one `h1`, `main`, all image alternatives, labeled buttons, and zero console/page errors. |
| Reduced motion | PASS | Emulated reduced motion computed `scroll-behavior: auto` and 0.01 ms animation/transition durations. |
| Privacy/network | PASS | Full live demo traffic had only the product origin; no API, analytics, tracker, remote font, or third-party runtime request. Health values remain in page memory; IndexedDB holds only timestamp precision in the isolated demo namespace. |
| PWA/offline | PASS | Service-worker install, controlled offline `/demo` reload, styled uncached-route fallback, update toast, `skipWaiting`, controller refresh, manifest, icons, and versioned caches all passed live. |
| Console | PASS | No console or page errors across cold, configured, legal, demo, reduced-motion, or 404 checks. |

Lighthouse 12.8.2 mobile on production (headless Chromium with shared-memory
workaround): Performance 100, Accessibility 100, Best Practices 100, SEO 100;
FCP 0.9 s, LCP 1.2 s, TBT 40 ms, CLS 0, INP not available for a lab navigation,
and 66 KiB transferred.

## Response policy, caching, links, and server scope

- HTTPS returns HSTS, same-origin CSP, `nosniff`, frame denial, strict referrer
  policy, and restrictive permissions policy.
- Hashed `/compiled/*` returns `public, max-age=31536000, immutable`; the mobile
  hero returns one-hour revalidation; `sw.js` returns `no-cache, no-store`.
- `/`, `/demo`, `/privacy/`, `/terms/`, source repository, robots, sitemap, and
  every product navigation link returned 200. An unknown route returned the
  designed page with HTTP 404.
- This is a static PWA with no server API, unlock call, account, payment, or
  sign-in endpoint. `POST`, `PUT`, and `DELETE /` return 405; `OPTIONS /`
  returns 204. There is no applicable API against which to observe a 429 or
  `Retry-After` threshold, and Entra authority checks are not applicable.

## Verification refresh

The candidate was checked again from the supplied checkout on 2026-08-28 UTC.
`npm ci`, `npm run lint`, `npm run build`, and a subsequent full `npm test`
all passed (24 Vitest + 27 Playwright). The 16 claim commands were also run
one-by-one and passed. The full live suite passed 27/27, and all 24 deployable
local build files matched live response bytes by SHA-256. The malformed CSV,
commented XML, incomplete XML, and 40,000-unclosed-record timing findings were
reproduced independently; the 40,000-record, 680,012-byte XML input took
8,185 ms before rejection.

## Required next step

Replace regex tag extraction with a bounded, structural XML parser that ignores
comments/CDATA, rejects malformed documents, enforces limits while streaming or
incrementally scanning, and never performs quadratic work on unclosed tags.
Tighten CSV quote-state validation or narrow the strict-parser claim and its
test to the exact malformed syntax actually guaranteed. Then rerun all 16
claim commands and the boundary reproductions before redeploying.
