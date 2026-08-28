# Adversarial first-read review 3

**Product:** Health Export Cleaner  
**URL:** <https://health-export-cleaner.sociobot.in>  
**Reviewed:** 2026-08-28  
**Base reviewed:** `325629810d43ef4d36787a367d801521cc8406da`  
**Verdict:** **FAIL**

One blocking finding remains. The visible demo is useful, but a reset/exit race
can write the demo's timestamp setting into the real preference database. A
pass requires zero findings.

## Cold first read

Fresh Chromium contexts were opened at 390 × 844 and 1440 × 900 with no prior
site storage. Before scrolling, I could answer all three required questions at
both sizes:

- **What it does:** makes a cleaned health export before it is shared, without
  common identifiers or location details.
- **For whom:** wearable users who need a cleaned copy to share.
- **What to click first:** **Try it with sample data**.

The exact first-screen text was **“Clean a health export before you share
it.”**, **“For wearable users who need a cleaned copy without common
identifiers or location details.”**, and **“Try it with sample data”** followed
by **“See a cleaned copy immediately.”** At 390 px, the action and all three
plain facts were visible without scrolling. No first-read blocker was found.

## Finding

### F-3-1 — Demo reset can overwrite a real cleaner preference

**Severity:** BLOCKING

- **Quote/location:** the live banner says **“Demo — sample data, nothing is
  saved”** and **“It stays separate from your cleaner preferences.”** The
  README says demo preferences **“never touch the normal cleaner
  preferences.”** The registered `sample-demo` claim promises the same
  isolation.
- **Observed behavior:** in a fresh live mobile context, I first seeded the
  normal `health-export-cleaner` IndexedDB database with an Exact timestamp
  preference and a unique marker. I entered `/demo`, selected Hour, clicked
  **Reset demo**, held a connection to the demo database long enough to exercise
  IndexedDB's normal blocked-delete state, and clicked **Clean my own file**
  while the sample reload was in flight. In two of three repetitions, the real
  record became `{timePrecision: "day"}` and its marker was lost. This is a
  nondeterministic cross-namespace write, not merely leftover demo storage.
- **Code cause:** `src/main.ts:253-263` starts an asynchronous sample reload on
  Reset, then changes the module-wide storage target to real before demo cleanup
  finishes on exit. The in-flight reload reaches `updatePreview()` and
  `savePreferences()` after the target changes. `src/storage.ts:8-16` implements
  that target as mutable shared state.
- **Why this blocks:** the demo-sandbox contract says nothing done in demo mode
  may persist to real storage. This flow changes a person's real preference
  while the banner explicitly promises separation.
- **Why the listed test misses it:** `tests/e2e/app.spec.ts:33-57` starts with no
  normal database, checks only that one is absent, and never seeds a real
  preference or delays demo deletion. Its registered command passes while the
  broader claim is false.
- **Concrete fix:** bind the storage namespace immutably for the lifetime of a
  page. Do not call `useDemoStorage(false)` inside the demo document; cancel or
  await every in-flight reset/sample inspection, delete only the demo database,
  then navigate so the new real page selects its own namespace. Handle
  `IDBOpenDBRequest.onblocked` without switching namespaces. Extend
  `@claim:sample-demo` to seed a unique real preference, exercise Reset and exit
  with delayed cleanup, and assert byte-for-byte that the real record is
  unchanged and the demo database is gone.
- **Copy until fixed:** do not weaken the intended isolation promise. If the
  behavior cannot be repaired immediately, replace it with the honest warning
  **“Demo settings are separate, but wait for Reset to finish before opening
  your own file.”** That workaround would still leave the demo below the
  required standard.

## Copy audit

Counts treat a hyphenated item, date, path, or command as one word. Headings,
buttons, and recovery text are included because they carry meaning. Dynamic
sample values and field names are excluded. No unit exceeds 22 words and no
banned marketing word appears. The three isolation promises are flagged
because F-3-1 makes them inaccurate.

### Landing page and interactive states

| Copy unit | Words | Result |
| --- | ---: | --- |
| A private cleaner for health exports | 6 | Pass |
| Clean a health export before you share it. | 8 | Pass |
| For wearable users who need a cleaned copy without common identifiers or location details. | 14 | Pass |
| Try it with sample data | 5 | Pass |
| See a cleaned copy immediately. | 5 | Pass |
| Opens CSV and Apple Health XML | 6 | Pass |
| Health records stay in this browser tab | 7 | Pass |
| Works offline after the first visit | 6 | Pass |
| Your file enters the browser. | 5 | Pass |
| Only the cleaned copy comes out. | 6 | Pass |
| The cleaning bench | 3 | Pass |
| Make a cleaned copy | 4 | Pass |
| Inspect — Choose a source | 4 | Pass |
| Minimize — Set the date range | 5 | Pass |
| Export — Review and save | 4 | Pass |
| Place an export on the bench | 6 | Pass |
| Supported: comma-separated CSV and Apple Health export.xml. | 7 | Pass |
| Files stay in this browser tab and are limited to 100 MB / 500,000 records for safety. | 16 | Pass |
| Choose or drop a health export | 6 | Pass |
| CSV or XML · maximum 100 MB | 6 | Pass |
| No account or installation required. | 5 | Pass |
| Inspecting locally… | 2 | Pass |
| Reading structure and fields | 4 | Pass |
| Source ready | 2 | Pass |
| Remove source | 2 | Pass |
| Set the date range | 4 | Pass |
| When either date is set, only rows with a usable date inside this range stay in the copy. | 18 | Pass |
| Rows without a usable date are left out. | 8 | Pass |
| The start date must be on or before the end date. | 11 | Pass |
| Choose record types | 3 | Pass |
| Select all | 2 | Pass |
| Select none | 2 | Pass |
| Choose fields | 2 | Pass |
| Common identifiers, device details, GPS, location, and route fields are locked out. | 12 | Pass |
| Review unfamiliar fields yourself. | 4 | Pass |
| Keep all available | 3 | Pass |
| Keep essentials only | 3 | Pass |
| Reduce timestamp precision | 3 | Pass |
| Day — 2026-08-28 · day only | 4 | Pass |
| Hour — 2026-08-28 14:00 | 3 | Pass |
| Exact — Keeps the source timestamp | 5 | Pass |
| Review what leaves | 3 | Pass |
| First five rows of the cleaned CSV | 7 | Pass |
| No fields are selected. | 4 | Pass |
| Select at least one available field to create a cleaned copy. | 11 | Pass |
| No record types are selected. | 5 | Pass |
| Select at least one record type to include rows. | 9 | Pass |
| No records match this date range. | 6 | Pass |
| Widen the dates to include rows. | 6 | Pass |
| Minimized does not mean anonymous. | 5 | Pass |
| Values, dates, rare conditions, and combinations of records can still identify someone. | 12 | Pass |
| Inspect the preview and the downloaded file before sharing. | 9 | Pass |
| Your records never leave this tab. | 6 | Pass |
| One download ZIP: the cleaned CSV plus file details and a risk note. | 13 | Pass |
| Download cleaned copy | 3 | Pass |
| Move cleaner preferences | 3 | Pass |
| Export or import the timestamp preference only. | 7 | Pass |
| Health records are never stored. | 5 | Pass |
| Export preferences | 2 | Pass |
| Import preferences | 2 | Pass |
| A smaller file, not an anonymity guarantee | 7 | Pass |
| The cleaner recognizes common identifier and location column names, but vendors can invent new ones. | 15 | Pass |
| Free text and unusual measurements may be identifying even when they are not labeled as such. | 16 | Pass |
| Apple Health support covers Record entries. | 6 | Pass |
| Workouts, routes, clinical records, ActivitySummary, and nested metadata are intentionally not included in v1. | 14 | Pass |
| Demo — sample data, nothing is saved | 6 | **F-3-1** |
| Change the sample freely. | 4 | Pass |
| It stays separate from your cleaner preferences. | 7 | **F-3-1** |
| Reset demo | 2 | Pass |
| Clean my own file | 4 | Pass |
| An update is ready. | 4 | Pass |
| Refresh now | 2 | Pass |
| Clean a health export before you share it. | 8 | Pass |
| Free to use under the MIT License. | 7 | Pass |
| Built by Param Factory. | 4 | Pass |
| Illustration generated for this product. | 5 | Pass |
| Source code on GitHub (external site) | 6 | Pass |

### Landing recovery and warning copy

| Copy unit | Words | Result |
| --- | ---: | --- |
| This file is empty. | 4 | Pass |
| Choose a CSV or Apple Health export.xml file. | 8 | Pass |
| This file is larger than the 100 MB safety limit ([file size]). | 12 | Pass |
| Split it at the source, then try a smaller part. | 10 | Pass |
| No CSV rows were found. | 5 | Pass |
| Check that the file has a header row. | 8 | Pass |
| This file has more than 500,000 records. | 7 | Pass |
| Split it into smaller date ranges first. | 7 | Pass |
| The CSV has headers but no data rows. | 8 | Pass |
| Export a CSV with at least one health record, then try again. | 12 | Pass |
| No record-type column was detected; all rows are grouped as “CSV record”. | 12 | Pass |
| [N] rows had a different number of columns and were padded or trimmed. | 13 | Pass |
| The CSV has text after a closing quote. | 8 | Pass |
| A quoted field must end at a comma or row ending. | 11 | Pass |
| The CSV has a quote inside an unquoted field. | 9 | Pass |
| Quote the whole field and export it again. | 8 | Pass |
| The CSV has an unclosed quoted field. | 7 | Pass |
| Export it again or repair that row. | 7 | Pass |
| This export has more than 500,000 records. | 7 | Pass |
| Export a smaller date range from the source first. | 9 | Pass |
| This XML contains a declaration the cleaner cannot read. | 9 | Pass |
| Export a fresh file from Apple Health and try again. | 10 | Pass |
| This file is missing the Apple Health data section. | 9 | Pass |
| Export it again from Apple Health, then try the new file. | 11 | Pass |
| This XML is too deeply nested (more than 256 elements). | 10 | Pass |
| Export a fresh Apple Health file and try again. | 9 | Pass |
| This Apple Health XML is malformed: [reason]. | 7 | Pass |
| Export the file again from Apple Health. | 7 | Pass |
| No Apple Health Record elements were found. | 7 | Pass |
| Workouts, routes, and clinical records are not supported in v1. | 10 | Pass |
| Workout elements are not included; only Apple Health Record elements are supported. | 12 | Pass |
| The file could not be read. | 6 | Pass |
| Try exporting it again. | 4 | Pass |
| Those preferences could not be imported. | 6 | Pass |
| Choose a preferences JSON file exported by this tool. | 9 | Pass |
| Remove “sample-health-export.csv” from this tab? | 5 | Pass |
| Your original file will not be changed. | 7 | Pass |

### README

| Copy unit | Words | Result |
| --- | ---: | --- |
| Health Export Cleaner | 3 | Pass |
| Health Export Cleaner helps wearable users make a cleaned copy of a health export before sharing it. | 17 | Pass |
| It opens supported CSV or Apple Health XML exports, then lets the user: | 13 | Pass |
| choose a date range and record types | 7 | Pass |
| choose which non-sensitive fields to keep | 6 | Pass |
| always remove common identifiers, device details, GPS, routes, and location | 10 | Pass |
| reduce timestamps to a day or hour | 7 | Pass |
| preview the result and the exact number of removed rows and fields; and | 13 | Pass |
| download one ZIP containing a cleaned CSV, file details, and a risk note | 13 | Pass |
| Health records stay in page memory and are not uploaded or retained. | 12 | Pass |
| Only the timestamp-precision preference is saved in IndexedDB. | 8 | Pass |
| The app works offline after its first visit. | 8 | Pass |
| Try the sample safely | 4 | Pass |
| Open /demo (or /?demo=1) to load sample wearable records immediately. | 10 | Pass |
| Demo preferences use a separate demo:health-export-cleaner IndexedDB database; they never touch the normal cleaner preferences. | 15 | **F-3-1** |
| The demo banner can reset the sample or discard its preference before cleaning your own file. | 16 | Pass |
| See .factory/demo.md for the sample and reset details. | 8 | Pass |
| The cleaner needs no account or installation. | 7 | Pass |
| Supported sources and limits | 4 | Pass |
| CSV with a header row. | 5 | Pass |
| Common type, date, and timestamp column names (including recorded_at) are detected. | 11 | Pass |
| When a date range is set, rows without a usable date are excluded rather than guessed. | 16 | Pass |
| A CSV without a type column is treated as one record type. | 12 | Pass |
| Apple Health export.xml. | 3 | Pass |
| Version 1 intentionally reads Record elements only; workouts, routes, clinical records, ActivitySummary, and nested metadata are omitted. | 17 | Pass |
| Files are capped at 100 MB and 500,000 parsed records to prevent a malformed or very large export from exhausting the tab. | 22 | Pass |
| Minimization is not anonymization. | 4 | Pass |
| Free-text values, rare measurements, dates, and combinations of otherwise ordinary data may identify a person. | 15 | Pass |
| Users should inspect the output before sharing it. | 8 | Pass |
| Develop | 1 | Pass |
| Requires Node.js 20 or newer. | 5 | Pass |
| The local development server is printed by Vite (normally http://localhost:5173). | 10 | Pass |
| Test and build | 3 | Pass |
| Playwright 1.58.2 is pinned. | 4 | Pass |
| In an environment without its Chromium binary, run npx playwright install chromium once. | 13 | Pass |
| To run the same browser checks against the deployed app, set PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in before npm run test:e2e. | 16 | Pass |
| dist/index.html is the static deployment entry. | 6 | Pass |
| /privacy/ and /terms/ are emitted as standalone pages. | 8 | Pass |
| /demo is the isolated sample route. | 6 | Pass |
| An unknown address receives the styled 404.html response with HTTP 404 on Static Web Apps. | 15 | Pass |
| Privacy and security model | 4 | Pass |
| All parsing, filtering, ZIP generation, and download creation happen in the browser. | 12 | Pass |
| No third-party runtime scripts, fonts, analytics, or trackers are included. | 10 | Pass |
| Health records remain in page memory and disappear on refresh or tab close. | 13 | Pass |
| See the in-product privacy notice for details. | 7 | Pass |
| The parser rejects broken CSV and invalid or unrelated XML. | 10 | Pass |
| It also stops files that exceed the size or record limits. | 11 | Pass |
| These checks cannot tell whether a vendor’s field contains sensitive data. | 11 | Pass |
| License | 1 | Pass |
| Free to use under the MIT License. | 7 | Pass |
| The product links to its public source code. | 8 | Pass |
| See LICENSE. | 2 | Pass |

Terminology is otherwise consistent: **health export** is the input, **sample
data** is the demo input, **cleaned copy** is the output, **cleaned CSV** is the
file inside the ZIP, and **date range** is the filter. Buttons use result-naming
verbs. Headings remain understandable out of context.

## Demo and sandbox verification

The first-screen action opened `/demo` in one click. At 390 px the destination
was already in the configured cleaner: `sample-health-export.csv`, CSV format,
3 records, 390 B, a 2026-08-20 to 2026-08-25 date span, filled date controls,
and realistic HeartRate/StepCount records. The fixed banner showed **Reset
demo** and **Clean my own file**. Reset restored Day precision and the sample.

During the ordinary demo/download flow, every request was same-origin, there
were no fetch/XHR/WebSocket calls, health rows remained in memory, and offline
reload passed. The demo database normally uses
`demo:health-export-cleaner`. F-3-1 is the exception: delayed cleanup plus an
in-flight reset can redirect the demo preference write to the normal database.

## Claims verification

A fresh shallow clone of the requested repository resolved to
`325629810d43ef4d36787a367d801521cc8406da`; `npm ci` completed with zero
vulnerabilities. Every command in `.factory/claims.json` was run separately.

| Claim id | Listed command | Result | Independent cross-check |
| --- | --- | --- | --- |
| sample-demo | `npm run test:e2e -- --grep @claim:sample-demo` | Pass | **Fail — F-3-1; test omits existing real state and delayed cleanup** |
| supported-sources | `npm run test:e2e -- --grep @claim:supported-sources` | Pass | Pass |
| no-setup | `npm run test:e2e -- --grep @claim:no-setup` | Pass | Pass |
| free-source | `npm run test:e2e -- --grep @claim:free-source` | Pass | Pass |
| first-party-runtime | `npm run test:e2e -- --grep @claim:first-party-runtime` | Pass | Pass |
| local-processing | `npm run test:e2e -- --grep @claim:local-processing` | Pass | Pass |
| offline-reload | `npm run test:e2e -- --grep @claim:offline-reload` | Pass | Pass |
| identifier-removal | `npm run test:e2e -- --grep @claim:identifier-removal` | Pass | Pass |
| minimization-controls | `npm run test:e2e -- --grep @claim:minimization-controls` | Pass | Pass |
| exact-timestamp | `npm run test:e2e -- --grep @claim:exact-timestamp` | Pass | Pass |
| csv-conventions | `npm run test:e2e -- --grep @claim:csv-conventions` | Pass | Pass |
| apple-record-scope | `npm run test:e2e -- --grep @claim:apple-record-scope` | Pass | Pass |
| clean-package | `npm run test:e2e -- --grep @claim:clean-package` | Pass | Pass |
| safety-limits | `npm run test:e2e -- --grep @claim:safety-limits` | Pass | Pass |
| removal-receipt | `npm run test:e2e -- --grep @claim:removal-receipt` | Pass | Pass |
| strict-parser | `npm run test:e2e -- --grep @claim:strict-parser` | Pass | Pass |
| preference-portability | `npm run test:e2e -- --grep @claim:preference-portability` | Pass | Pass |
| update-ready | `npm run test:e2e -- --grep @claim:update-ready` | Pass | Pass |
| designed-404 | `npm run test:e2e -- --grep @claim:designed-404` | Pass | Pass |

The complete deployed suite also passed 29/29. The normal live flow confirmed
same-origin-only requests and offline reload. No separate unlisted claim-like
sentence was found; the problem is that the listed `sample-demo` claim and its
test do not cover the failing state transition.

## Earlier findings: independently checked

Every earlier `review-*.md`, `polish-*.md`, and the prior handoff was read. Each
earlier finding was checked in current source and on the live site.

| Earlier id | Current verification |
| --- | --- |
| F-1-1 | Fixed: Day says **“day only”**; no “safest” comparison remains. |
| F-1-2 | Fixed: update copy says **“An update is ready.”** and `update-ready` passed. |
| F-1-3 | Fixed: the unsupported runtime-keys/services sentence remains absent. |
| F-1-4 | Fixed: `designed-404` is registered and the live unknown route returned styled HTTP 404. |
| F-1-5 | Fixed: Privacy, browser Back, Terms, Forward, and 404 focus the destination `h1` and announce the route. |
| F-1-6 | Fixed: home, demo, legal pages, and 404 use the same wordmark, nav, badge, footer, maker, and build ID. |
| F-1-7 | Fixed: the link says **“Source code on GitHub (external site)”**. |
| F-1-8 | Fixed: result terminology is **cleaned copy**; ZIP names only the container. |
| F-1-9 | Fixed: visitor-facing filter language consistently uses **date range**. |
| F-1-10 | Fixed: UI, docs, terms, and output use **file details and risk note**. |
| F-1-11 | Fixed: README parser copy uses concrete broken-file and limit wording. |
| F-1-12 | Fixed: the XML declaration error states the problem and next action. |
| F-1-13 | Fixed as wording/intent: exit says **Clean my own file**. Its newly found storage race is F-3-1, not a regression of the label. |
| F-1-14 | Fixed: the header-only CSV error includes the next action. |
| F-1-15 | Fixed: the missing Apple Health data error includes the next action. |
| F-1-16 | Fixed: README says **browser checks**, not “browser matrix.” |
| F-2-1 | Fixed: `exact-timestamp` is registered and the fresh-demo ZIP test preserved `2026-08-20 08:12:41 +0000`. |

No earlier finding is being reopened under its old id.

## Structure, accessibility, and identity

Live `/`, `/demo`, `/?demo=1`, `/privacy/`, and `/terms/` returned 200. An
unknown address returned the designed 404 with HTTP 404. Each route had one
`h1`, `lang=en`, a main landmark, a route-specific title, a description,
canonical URL, Open Graph/Twitter metadata, social image, and favicon. The
titles were:

- `Health Export Cleaner — minimize health files locally`
- `Demo — Health Export Cleaner`
- `Privacy — Health Export Cleaner`
- `Terms — Health Export Cleaner`
- `Page not found — Health Export Cleaner`

All navigational links from the landing, demo, legal, and 404 pages resolved;
the GitHub link returned 200. Privacy navigation and browser Back focused the
correct `h1`. The full live suite's Axe checks found no serious or critical
violations and its keyboard, reduced-motion, mobile, and route-focus checks
passed. There were no application console errors on valid routes.

The concrete-and-moss sorting-bench identity is distinct rather than a generic
SaaS template: hard rules, stamped labels, square controls, restrained moss and
rust, and the original sorting-machine illustration all support the local data
reduction job. The landing information follows the required skeleton without a
generic gradient hero or three-card feature row.

## Missed leverage

No missing AI feature, sync, or broader import was identified. The brief is for
bounded local cleaning, and a gateway call or cloud sync would work against its
core privacy job. CSV and Apple Health XML import, cleaned ZIP export, and
preference import/export are present. Adding unsupported analysis would not be
obvious user value for this scope.

## Verification summary

- Fresh clone: all 19 claim commands passed separately.
- Fresh clone: `npm run lint` passed.
- Fresh clone: `npm test` passed (31 unit/contract tests and 29 browser tests).
- Fresh clone: `npm run build` passed and produced `dist/`; main JS was 9.27 kB gzip.
- Live: full Playwright suite passed 29/29.
- Live: fresh mobile and desktop cold reads, demo, request log, storage,
  offline, routes, metadata, link crawl, focus, and 404 were checked.
- Adversarial live storage test: reproduced F-3-1 in two of three delayed-cleanup runs.

## What would make this perfect

Make the demo storage namespace immutable for the demo document, serialize or
cancel Reset before exit, and add the pre-existing-real-preference plus blocked
cleanup case to `@claim:sample-demo`. Re-run that claim and the complete suite.
With F-3-1 closed, this round has no other finding.
