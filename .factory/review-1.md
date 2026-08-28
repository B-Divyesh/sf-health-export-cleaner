# Adversarial first-read review 1

**Product:** Health Export Cleaner  
**URL:** https://health-export-cleaner.sociobot.in  
**Reviewed:** 2026-08-28  
**Verdict:** **FAIL**

There are 16 minor findings and no blocking findings. A pass requires zero
findings.

## Cold first read

Fresh Chromium contexts were used at 390 × 844 and 1440 × 900. Before
scrolling, I understood that this makes a smaller health export while removing
common identifiers and location details; it is for wearable users preparing an
export to share; and I should click **Try it with sample data** first. All three
answers are explicit in the first screen at both sizes. No blocking first-read
finding was recorded.

## Findings

All findings are **minor**, ordered by risk and then scope.

### F-1-1 — “Safest default” is an unlisted safety claim

- Quote/location: **“2026-08-28 · safest default”**, Day precision helper
  (`index.html:132`).
- Impact: a person handling health data may treat “safest” as an assurance. No
  claim test can establish safety for a particular export.
- Fix: use **“2026-08-28 · day only”**.

### F-1-2 — The update notice makes an unlisted comparison

- Quote/location: **“A safer, newer version is ready.”** (`index.html:174`).
- Impact: the update test proves activation, not that a build is safer.
- Fix: use **“An update is ready.”** Add an `update-ready` claim and tag the
  existing service-worker update test.

### F-1-3 — The README makes an unlisted no-keys/no-services claim

- Quote/location: **“There are no runtime API keys or services.”**
  (`README.md:54`).
- Impact: `first-party-runtime` checks requests/assets, but its registered claim
  does not cover embedded keys or the absence of runtime services.
- Fix: add a `no-runtime-secrets` claim with a built-output secret/endpoint
  scan, or remove the sentence.

### F-1-4 — The README’s 404 claim is tested but not registered

- Quote/location: **“/demo is the isolated sample route and an unknown address
  receives the styled 404.html response with HTTP 404 on Static Web Apps.”**
  (`README.md:73-75`).
- Impact: this is observable deployer-facing behavior but has no claims entry.
- Fix: add `designed-404` to `claims.json` and tag the existing test at
  `tests/e2e/app.spec.ts:514`.

### F-1-5 — Route changes leave focus on `BODY`

- Location: live navigation from `/` to `/privacy/`; Terms and 404 use the same
  static-page pattern.
- Impact: keyboard and screen-reader users receive no focus or polite
  announcement of the new page.
- Fix: on route entry, focus the `h1` and announce it through an
  `aria-live="polite"` region. Test Privacy, Terms, back, and forward.

### F-1-6 — Header/footer chrome changes between routes

- Quote/location: `/` has **“H// Health Export Cleaner”** and **“Local only”**;
  legal/404 pages show **“H//”** and **“Back to cleaner”**. Their footer
  one-liners and link sets also differ.
- Impact: legal pages lose the product name and Demo navigation; this violates
  the shared route skeleton.
- Fix: share one header/footer with the full linked wordmark and the same Demo,
  Privacy, Terms, product one-liner, maker, and build ID.

### F-1-7 — The external source link does not identify its destination

- Quote/location: landing footer **“Source code”** link to GitHub.
- Impact: it does not say that it leaves the site.
- Fix: use **“Source code on GitHub (external site)”**.

### F-1-8 — The output has too many names

- Quotes: **“smaller health file,” “bounded copy,” “minimized copy,” “cleaned
  sample export,” “cleaned copy,” “cleaned CSV,”** and **“clean package.”**
- Impact: visitors must infer whether these are different artifacts.
- Fix: use **“cleaned copy”** for the result and **“download ZIP”** only for its
  container: **“Make a cleaned copy,” “See a cleaned copy immediately,”** and
  **“Download the cleaned copy.”**

### F-1-9 — “Date range” and “date boundary” name one control

- Quotes: README **“choose a date range”**; landing **“Set the date boundary,”
  “inside your boundary,”** and **“No records match this date boundary.”**
- Impact: the vocabulary changes without the concept changing.
- Fix: use **“date range”** throughout.

### F-1-10 — “Provenance” is unexplained jargon

- Quotes: **“plain-language provenance note,” “provenance/risk note,”** and
  Terms **“Review the output and provenance note before sharing.”**
- Impact: calling the note plain-language does not explain “provenance.”
- Fix: use **“file details and risk note”** in UI, docs, filename, and heading.

### F-1-11 — The parser description uses abstract security jargon

- Quote/location: **“structural limits”** and **“resource-safety measures”**
  (`README.md:85-89`).
- Fix: **“The parser rejects broken CSV and invalid or unrelated XML. It also
  stops files that exceed the size or record limits. These checks cannot tell
  whether a vendor’s field contains sensitive data.”**

### F-1-12 — One XML error leads with schema jargon

- Quote/location: **“This XML is not a supported Apple Health export: document
  type declarations are not supported.”** (`src/parser.ts:141`).
- Fix: **“This XML contains a declaration the cleaner cannot read. Export a
  fresh file from Apple Health and try again.”**

### F-1-13 — “Start for real” does not name the result

- Quote/location: demo banner link **“Start for real”** (`index.html:171`).
- Impact: it does not say that it clears the demo and opens the empty cleaner.
- Fix: use **“Clean my own file.”**

### F-1-14 — The header-only CSV error gives no next action

- Quote/location: **“The CSV has headers but no data rows.”**
  (`src/parser.ts:53`).
- Fix: **“The CSV has headers but no data rows. Export a CSV with at least one
  health record, then try again.”**

### F-1-15 — The missing-HealthData error gives no next action

- Quote/location: **“This XML is not a supported Apple Health export: the
  HealthData element is missing.”** (`src/parser.ts:158,175`).
- Fix: **“This file is missing the Apple Health data section. Export it again
  from Apple Health, then try the new file.”**

### F-1-16 — “Browser matrix” is jargon and overstates the test scope

- Quote/location: **“To run the same browser matrix…”** (`README.md:68`).
- Impact: the configured suite runs one Chromium project, not a multi-browser
  matrix.
- Fix: use **“To run the same browser checks against the deployed app…”**

## Copy audit

Counts treat a hyphenated term, date, path, or command as one word. Labels and
sample values are excluded; controls and headings are included because the
plain-words rules cover them.

### Landing page and interactive states

| Copy | Words | Flag |
| --- | ---: | --- |
| A private cleaner for health exports | 6 | — |
| Clean a health export before you share it. | 9 | — |
| For wearable users who need a smaller health file to share without common identifiers or location details. | 17 | F-1-8 |
| Try it with sample data | 6 | — |
| See a cleaned sample export immediately. | 6 | F-1-8 |
| Opens CSV and Apple Health XML | 6 | — |
| Health records stay in this browser tab | 7 | — |
| Works offline after the first visit | 6 | — |
| Your file enters the browser. | 5 | — |
| Only the minimized copy comes out. | 6 | F-1-8 |
| Make a bounded copy | 5 | F-1-8 |
| Inspect — Choose a source | 5 | — |
| Minimize — Set the boundary | 5 | F-1-9 |
| Export — Review and save | 5 | — |
| Place an export on the bench | 7 | — |
| Supported: comma-separated CSV and Apple Health export.xml. | 7 | — |
| Files stay in this browser tab and are limited to 100 MB / 500,000 records for safety. | 17 | — |
| Choose or drop a health export | 6 | — |
| CSV or XML · maximum 100 MB | 6 | — |
| No account or installation required. | 5 | — |
| Inspecting locally… | 2 | — |
| Reading structure and fields | 4 | — |
| Set the date boundary | 5 | F-1-9 |
| When either date is set, only rows with a usable date inside this range stay in the copy. | 18 | — |
| Rows without a usable date are left out. | 9 | — |
| The start date must be on or before the end date. | 11 | — |
| Choose record types | 4 | — |
| Select all / Select none | 2 / 2 | — |
| Choose fields | 3 | — |
| Common identifiers, device details, GPS, location, and route fields are locked out. | 12 | — |
| Review unfamiliar fields yourself. | 4 | — |
| Keep all available / Keep essentials only | 3 / 3 | — |
| Reduce timestamp precision | 3 | — |
| 2026-08-28 · safest default | 3 | F-1-1 |
| Review what leaves | 4 | — |
| First five rows of the cleaned CSV | 7 | F-1-8 |
| No fields are selected. | 5 | — |
| Select at least one available field to create a cleaned copy. | 11 | F-1-8 |
| No record types are selected. | 5 | — |
| Select at least one record type to include rows. | 10 | — |
| No records match this date boundary. | 7 | F-1-9 |
| Widen the dates to include rows. | 7 | — |
| Minimized does not mean anonymous. | 5 | — |
| Values, dates, rare conditions, and combinations of records can still identify someone. | 12 | — |
| Inspect the preview and the downloaded file before sharing. | 9 | — |
| Your records never leave this tab. | 6 | — |
| One ZIP: the cleaned CSV and its plain-language provenance note. | 10 | F-1-8, F-1-10 |
| Download clean package | 3 | F-1-8 |
| Export or import the timestamp preference only. | 7 | — |
| Health records are never stored. | 5 | — |
| Export preferences / Import preferences | 2 / 2 | — |
| A smaller file, not an anonymity guarantee | 7 | — |
| The cleaner recognizes common identifier and location column names, but vendors can invent new ones. | 14 | — |
| Free text and unusual measurements may be identifying even when they are not labeled as such. | 16 | — |
| Apple Health support covers Record entries. | 6 | — |
| Workouts, routes, clinical records, ActivitySummary, and nested metadata are intentionally not included in v1. | 14 | — |
| Demo — sample data, nothing is saved | 7 | — |
| Change the sample freely. | 4 | — |
| It stays separate from your cleaner preferences. | 7 | — |
| Reset demo | 2 | — |
| Start for real | 3 | F-1-13 |
| A safer, newer version is ready. | 6 | F-1-2 |
| Refresh now | 2 | — |
| Free to use. | 3 | — |
| MIT-licensed source code. | 3 | — |
| Built by Param Factory. | 4 | — |
| Illustration generated for this product. | 5 | — |

### Landing error and warning copy

| Copy | Words | Flag |
| --- | ---: | --- |
| This file is empty. | 4 | — |
| Choose a CSV or Apple Health export.xml file. | 9 | — |
| This file is larger than the 100 MB safety limit. | 10 | — |
| Split it at the source, then try a smaller part. | 10 | — |
| No CSV rows were found. | 5 | — |
| Check that the file has a header row. | 8 | — |
| This file has more than 500,000 records. | 8 | — |
| Split it into smaller date ranges first. | 7 | — |
| The CSV has headers but no data rows. | 8 | F-1-14 |
| No record-type column was detected; all rows are grouped as “CSV record”. | 12 | — |
| The CSV has text after a closing quote. | 8 | — |
| A quoted field must end at a comma or row ending. | 11 | — |
| The CSV has a quote inside an unquoted field. | 9 | — |
| Quote the whole field and export it again. | 8 | — |
| The CSV has an unclosed quoted field. | 7 | — |
| Export it again or repair that row. | 7 | — |
| This export has more than 500,000 records. | 8 | — |
| Export a smaller date range from the source first. | 9 | — |
| This XML is not a supported Apple Health export: document type declarations are not supported. | 15 | F-1-12 |
| Export the file again from Apple Health. | 7 | — |
| This XML is not a supported Apple Health export: the HealthData element is missing. | 14 | F-1-15 |
| This XML is too deeply nested (more than 64 elements). | 10 | — |
| Export a fresh Apple Health file and try again. | 9 | — |
| No Apple Health Record elements were found. | 7 | — |
| Workouts, routes, and clinical records are not supported in v1. | 10 | — |
| Workout elements are not included; only Apple Health Record elements are supported. | 12 | — |
| The file could not be read. / Try exporting it again. | 6 / 4 | — |
| Remove source | 2 | — |
| Remove “sample-health-export.csv” from this tab? | 5 | — |
| Your original file will not be changed. | 7 | — |
| Those preferences could not be imported. | 6 | — |
| Choose a preferences JSON file exported by this tool. | 9 | — |

No landing sentence exceeds 22 words. No banned plain-words term appears;
the unsupported comparative “safer” is F-1-2.

### README

| Copy | Words | Flag |
| --- | ---: | --- |
| Health Export Cleaner | 3 | — |
| Health Export Cleaner helps wearable users clean a smaller health export before sharing it. | 14 | F-1-8 |
| It opens supported CSV or Apple Health XML exports, then lets the user: | 13 | — |
| choose a date range and record types | 7 | F-1-9 |
| choose which non-sensitive fields to keep | 6 | — |
| always remove common identifiers, device details, GPS, routes, and location | 10 | — |
| reduce timestamps to a day or hour | 7 | — |
| preview the result and the exact number of removed rows and fields | 12 | — |
| download one ZIP containing a cleaned CSV and a provenance/risk note | 11 | F-1-8, F-1-10 |
| Health records stay in page memory and are not uploaded or retained. | 12 | — |
| Only the timestamp-precision preference is saved in IndexedDB. | 8 | — |
| The app works offline after its first visit. | 8 | — |
| Try the sample safely | 4 | — |
| Open /demo (or /?demo=1) to load sample wearable records immediately. | 11 | — |
| Demo preferences use a separate demo:health-export-cleaner IndexedDB database; they never touch the normal cleaner preferences. | 16 | — |
| The demo banner can reset the sample or discard its preference before starting for real. | 15 | — |
| See .factory/demo.md for the sample and reset details. | 10 | — |
| The cleaner needs no account or installation. | 7 | — |
| Supported sources and limits | 4 | — |
| CSV with a header row. | 5 | — |
| Common type, date, and timestamp column names (including recorded_at) are detected. | 12 | — |
| When a date boundary is set, rows without a usable date are excluded rather than guessed. | 16 | F-1-9 |
| A CSV without a type column is treated as one record type. | 12 | — |
| Apple Health export.xml. | 4 | — |
| Version 1 intentionally reads Record elements only; workouts, routes, clinical records, ActivitySummary, and nested metadata are omitted. | 17 | — |
| Files are capped at 100 MB and 500,000 parsed records to prevent a malformed or very large export from exhausting the tab. | 22 | — |
| Minimization is not anonymization. | 4 | — |
| Free-text values, rare measurements, dates, and combinations of otherwise ordinary data may identify a person. | 15 | — |
| Users should inspect the output before sharing it. | 8 | F-1-8 |
| Develop | 1 | — |
| Requires Node.js 20 or newer. | 6 | — |
| The local development server is printed by Vite (normally http://localhost:5173). | 12 | — |
| There are no runtime API keys or services. | 8 | F-1-3 |
| Test and build | 3 | — |
| Playwright 1.58.2 is pinned. | 6 | — |
| In an environment without its Chromium binary, run npx playwright install chromium once. | 13 | — |
| To run the same browser matrix against the deployed app, set PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in before npm run test:e2e. | 16 | F-1-16 |
| dist/index.html is the static deployment entry. | 6 | — |
| /privacy/ and /terms/ are emitted as standalone pages. | 8 | — |
| /demo is the isolated sample route and an unknown address receives the styled 404.html response with HTTP 404 on Static Web Apps. | 22 | F-1-4 |
| Privacy and security model | 4 | — |
| All parsing, filtering, ZIP generation, and download creation happen in the browser. | 12 | — |
| No third-party runtime scripts, fonts, analytics, or trackers are included. | 10 | — |
| Health records remain in page memory and disappear on refresh or tab close. | 13 | — |
| See the in-product privacy notice for details. | 7 | — |
| The parser uses structural limits and rejects malformed quoted CSV input and invalid or unrelated XML. | 16 | F-1-11 |
| These controls are resource-safety measures, not a guarantee that a vendor-defined column is non-sensitive. | 14 | F-1-11 |
| License | 1 | — |
| Free to use under the MIT License. | 7 | — |
| The product links to its public source code. | 8 | — |
| See LICENSE. | 2 | — |

## Demo and sandbox

- One click from the cold page opens `/demo` with `sample-health-export.csv`,
  three realistic HeartRate/StepCount records, a populated receipt, and preview.
- The persistent banner and its Reset/Start actions are visible at 390 px.
- Reset restores the sample and Day precision.
- Direct `/demo` creates only `demo:health-export-cleaner`. A manual flow saved
  Hour in real preferences, changed/reset the demo, chose Start for real, and
  confirmed Hour remained selected in the real cleaner.
- The complete demo flow made only same-origin requests. Sentinel health values
  were absent from IndexedDB and Cache Storage. Offline reload stayed usable.

Result: pass; no blocking demo/sandbox finding.

## Claims verification

Every command in `.factory/claims.json` was run separately after `npm ci`.

| Claim | Result | Evidence |
| --- | --- | --- |
| sample-demo | PASS | `tests/e2e/app.spec.ts:33` |
| supported-sources | PASS | `tests/e2e/app.spec.ts:47` |
| no-setup | PASS | `tests/e2e/app.spec.ts:58` |
| free-source | PASS | `tests/e2e/app.spec.ts:68` |
| first-party-runtime | PASS | `tests/e2e/app.spec.ts:80` |
| local-processing | PASS | `tests/e2e/app.spec.ts:399` |
| offline-reload | PASS | `tests/e2e/app.spec.ts:433` |
| identifier-removal | PASS | `tests/e2e/app.spec.ts:124` |
| minimization-controls | PASS | `tests/e2e/app.spec.ts:286` |
| csv-conventions | PASS | `tests/e2e/app.spec.ts:247` |
| apple-record-scope | PASS | `tests/e2e/app.spec.ts:312` |
| clean-package | PASS | `tests/e2e/app.spec.ts:99` |
| safety-limits | PASS | `tests/e2e/app.spec.ts:202` |
| removal-receipt | PASS | `tests/e2e/app.spec.ts:167` |
| strict-parser | PASS | `tests/e2e/app.spec.ts:177` |
| preference-portability | PASS | `tests/e2e/app.spec.ts:337` |

F-1-1 through F-1-4 are additional claim-like sentences not registered in
`claims.json`; the inventory is therefore incomplete despite all listed tests
passing.

## Structure, accessibility, and history

- Titles pass on `/`, `/demo`, `/privacy/`, `/terms/`, and 404; home is 53
  characters. Each route has `lang`, one `h1`, `main`, description, canonical,
  OG/Twitter image, SVG favicon, and apple-touch icon.
- Unknown paths return the designed 404. All crawled route/asset links and the
  GitHub link returned 200. Robots and sitemap include public routes.
- Live CSP/security headers load without console errors. `verify-url.sh`
  passed. Live axe found 0 violations. Repository axe, keyboard, 390 px,
  reduced-motion, offline fallback, and service-worker update tests passed.
- Build size is 9.14 kB JS gzip and 4.43 kB CSS gzip.
- The concrete-and-moss sorting-bench identity is product-specific, matches
  `.factory/design.md`, and is not a generic SaaS template.
- Failures are F-1-5 through F-1-7.

No earlier `review-*` or `polish-*` exists. The prior handoff’s functional
claims were reconfirmed live and in code: listed claims, local/live suites,
mobile, keyboard, axe, offline, malformed input, privacy, downloads, updates,
metadata, CSP, caching, and same-origin behavior pass. It did not identify the
new findings, so no earlier finding ID carries forward.

## Missed leverage

No AI, sync, or cloud addition is warranted. The brief calls for a local
cleaning operation; AI would weaken its offline/privacy model. Import, preview,
preference portability, and cleaned ZIP export already exist.

## Verification summary

```text
npm ci                                                        PASS
all 16 claims.json commands, separately                       PASS
npm test                                                       PASS (28 + 27)
npm run lint                                                   PASS
npm run build                                                  PASS; dist/ emitted
deployed npm run test:e2e                                      PASS (27/27)
verify-url.sh                                                  PASS
axe CLI                                                        PASS (0 violations)
live link crawl                                                PASS
```

## What would make this perfect

Resolve F-1-1 through F-1-16, then repeat the complete cold, demo, claims,
offline, copy, route, link, and accessibility review from fresh contexts. A
perfect result has no copy flags and no findings.
