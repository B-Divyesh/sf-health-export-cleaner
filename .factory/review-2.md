# Adversarial first-read review 2

**Product:** Health Export Cleaner  
**URL:** <https://health-export-cleaner.sociobot.in>  
**Reviewed:** 2026-08-28  
**Base reviewed:** `0fcbfbca2222261405c3e005eb97e1b947ae6c10`  
**Verdict:** **FAIL**

One minor finding remains. The acceptance rule is zero findings, so this is not pass-adjacent acceptance.

## Cold first read

Fresh Chromium contexts were opened without prior storage at 390 × 844 and 1440 × 900 before scrolling. The first screen made all three required answers clear at both sizes:

- **What it does:** It cleans a health export before it is shared, removing common identifiers and location details.
- **For whom:** Wearable users who want a cleaned copy to share.
- **What to click first:** **Try it with sample data**.

The exact first-screen text was **“Clean a health export before you share it.”**, **“For wearable users who need a cleaned copy without common identifiers or location details.”**, and **“Try it with sample data”** followed by **“See a cleaned copy immediately.”** No blocking first-read finding was identified.

## Finding

### F-2-1 — Exact timestamp preservation is an unlisted claim

**Severity:** minor

- **Quote/location:** In the landing cleaner's timestamp control: **“Exact — Keeps the source timestamp”** (`index.html`, precision options).
- **Why this fails review:** This is a result a visitor can rely on when choosing a privacy setting. `.factory/claims.json` has no `exact-timestamp` entry. The related `minimization-controls` claim and tagged test verify day and hour reduction only; they do not select **Exact** and inspect the download. The promise is therefore outside the tested claims contract.
- **Concrete fix:** Either remove the Exact option, or add an `exact-timestamp` claim such as **“Exact precision preserves the source timestamp in the cleaned CSV.”** Add one fresh-`/demo` test tagged `@claim:exact-timestamp` that selects Exact, downloads the sample, and asserts the original `2026-08-20 08:12:41 +0000` timestamp is retained.

## Copy audit

Counts treat a hyphenated item, date, path, and command as one word. The audit includes headings, buttons, labels, and recovery text because they carry meaning on the landing route. No landing unit exceeds 22 words. No banned plain-words term occurs. `F-2-1` is the only flag.

### Landing page

| Copy unit | Words | Result |
| --- | ---: | --- |
| A private cleaner for health exports | 6 | Pass |
| Clean a health export before you share it. | 9 | Pass |
| For wearable users who need a cleaned copy without common identifiers or location details. | 13 | Pass |
| Try it with sample data | 6 | Pass |
| See a cleaned copy immediately. | 5 | Pass |
| Opens CSV and Apple Health XML | 6 | Pass |
| Health records stay in this browser tab | 7 | Pass |
| Works offline after the first visit | 6 | Pass |
| Your file enters the browser. | 5 | Pass |
| Only the cleaned copy comes out. | 6 | Pass |
| The cleaning bench | 3 | Pass |
| Make a cleaned copy | 4 | Pass |
| Inspect — Choose a source | 5 | Pass |
| Minimize — Set the date range | 6 | Pass |
| Export — Review and save | 5 | Pass |
| Place an export on the bench | 7 | Pass |
| Supported: comma-separated CSV and Apple Health export.xml. | 7 | Pass |
| Files stay in this browser tab and are limited to 100 MB / 500,000 records for safety. | 17 | Pass |
| Choose or drop a health export | 6 | Pass |
| CSV or XML · maximum 100 MB | 6 | Pass |
| No account or installation required. | 5 | Pass |
| Inspecting locally… | 2 | Pass |
| Reading structure and fields | 4 | Pass |
| Source ready | 2 | Pass |
| Remove source | 2 | Pass |
| Set the date range | 5 | Pass |
| When either date is set, only rows with a usable date inside this range stay in the copy. | 18 | Pass |
| Rows without a usable date are left out. | 9 | Pass |
| The start date must be on or before the end date. | 11 | Pass |
| Choose record types | 4 | Pass |
| Select all | 2 | Pass |
| Select none | 2 | Pass |
| Choose fields | 3 | Pass |
| Common identifiers, device details, GPS, location, and route fields are locked out. | 12 | Pass |
| Review unfamiliar fields yourself. | 4 | Pass |
| Keep all available | 3 | Pass |
| Keep essentials only | 3 | Pass |
| Reduce timestamp precision | 3 | Pass |
| Day — 2026-08-28 · day only | 4 | Pass |
| Hour — 2026-08-28 14:00 | 3 | Pass |
| Exact — Keeps the source timestamp | 6 | **F-2-1** |
| Review what leaves | 4 | Pass |
| First five rows of the cleaned CSV | 7 | Pass |
| No fields are selected. | 5 | Pass |
| Select at least one available field to create a cleaned copy. | 11 | Pass |
| No record types are selected. | 5 | Pass |
| Select at least one record type to include rows. | 10 | Pass |
| No records match this date range. | 7 | Pass |
| Widen the dates to include rows. | 7 | Pass |
| Minimized does not mean anonymous. | 5 | Pass |
| Values, dates, rare conditions, and combinations of records can still identify someone. | 12 | Pass |
| Inspect the preview and the downloaded file before sharing. | 9 | Pass |
| Your records never leave this tab. | 6 | Pass |
| One download ZIP: the cleaned CSV plus file details and a risk note. | 12 | Pass |
| Download cleaned copy | 3 | Pass |
| Move cleaner preferences | 3 | Pass |
| Export or import the timestamp preference only. | 7 | Pass |
| Health records are never stored. | 5 | Pass |
| Export preferences | 2 | Pass |
| Import preferences | 2 | Pass |
| A smaller file, not an anonymity guarantee | 7 | Pass |
| The cleaner recognizes common identifier and location column names, but vendors can invent new ones. | 14 | Pass |
| Free text and unusual measurements may be identifying even when they are not labeled as such. | 16 | Pass |
| Apple Health support covers Record entries. | 6 | Pass |
| Workouts, routes, clinical records, ActivitySummary, and nested metadata are intentionally not included in v1. | 14 | Pass |
| Demo — sample data, nothing is saved | 7 | Pass |
| Change the sample freely. | 4 | Pass |
| It stays separate from your cleaner preferences. | 7 | Pass |
| Reset demo | 2 | Pass |
| Clean my own file | 4 | Pass |
| An update is ready. | 4 | Pass |
| Refresh now | 2 | Pass |
| Clean a health export before you share it. | 9 | Pass |
| Free to use under the MIT License. | 8 | Pass |
| Built by Param Factory. | 4 | Pass |
| Illustration generated for this product. | 5 | Pass |
| Source code on GitHub (external site) | 6 | Pass |

### Landing recovery and warning copy

| Copy unit | Words | Result |
| --- | ---: | --- |
| This file is empty. | 4 | Pass |
| Choose a CSV or Apple Health export.xml file. | 9 | Pass |
| This file is larger than the 100 MB safety limit. | 10 | Pass |
| Split it at the source, then try a smaller part. | 10 | Pass |
| No CSV rows were found. | 5 | Pass |
| Check that the file has a header row. | 8 | Pass |
| This file has more than 500,000 records. | 8 | Pass |
| Split it into smaller date ranges first. | 7 | Pass |
| The CSV has headers but no data rows. | 8 | Pass |
| Export a CSV with at least one health record, then try again. | 11 | Pass |
| No record-type column was detected; all rows are grouped as “CSV record”. | 12 | Pass |
| The CSV has text after a closing quote. | 8 | Pass |
| A quoted field must end at a comma or row ending. | 11 | Pass |
| The CSV has a quote inside an unquoted field. | 9 | Pass |
| Quote the whole field and export it again. | 8 | Pass |
| The CSV has an unclosed quoted field. | 7 | Pass |
| Export it again or repair that row. | 7 | Pass |
| This XML contains a declaration the cleaner cannot read. | 9 | Pass |
| Export a fresh file from Apple Health and try again. | 10 | Pass |
| This file is missing the Apple Health data section. | 9 | Pass |
| Export it again from Apple Health, then try the new file. | 11 | Pass |
| This XML is too deeply nested (more than 64 elements). | 10 | Pass |
| No Apple Health Record elements were found. | 7 | Pass |
| Workouts, routes, and clinical records are not supported in v1. | 10 | Pass |
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
| Only the timestamp-precision preference is saved in IndexedDB. | 7 | Pass |
| The app works offline after its first visit. | 8 | Pass |
| Try the sample safely | 4 | Pass |
| Open /demo (or /?demo=1) to load sample wearable records immediately. | 11 | Pass |
| Demo preferences use a separate demo:health-export-cleaner IndexedDB database; they never touch the normal cleaner preferences. | 15 | Pass |
| The demo banner can reset the sample or discard its preference before cleaning your own file. | 16 | Pass |
| See .factory/demo.md for the sample and reset details. | 10 | Pass |
| The cleaner needs no account or installation. | 7 | Pass |
| Supported sources and limits | 4 | Pass |
| CSV with a header row. | 5 | Pass |
| Common type, date, and timestamp column names (including recorded_at) are detected. | 12 | Pass |
| When a date range is set, rows without a usable date are excluded rather than guessed. | 16 | Pass |
| A CSV without a type column is treated as one record type. | 12 | Pass |
| Apple Health export.xml. | 4 | Pass |
| Version 1 intentionally reads Record elements only; workouts, routes, clinical records, ActivitySummary, and nested metadata are omitted. | 17 | Pass |
| Files are capped at 100 MB and 500,000 parsed records to prevent a malformed or very large export from exhausting the tab. | 22 | Pass |
| Minimization is not anonymization. | 4 | Pass |
| Free-text values, rare measurements, dates, and combinations of otherwise ordinary data may identify a person. | 15 | Pass |
| Users should inspect the output before sharing it. | 8 | Pass |
| Develop | 1 | Pass |
| Requires Node.js 20 or newer. | 6 | Pass |
| The local development server is printed by Vite (normally http://localhost:5173). | 12 | Pass |
| Test and build | 3 | Pass |
| Playwright 1.58.2 is pinned. | 6 | Pass |
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
| These checks cannot tell whether a vendor’s field contains sensitive data. | 12 | Pass |
| License | 1 | Pass |
| Free to use under the MIT License. | 7 | Pass |
| The product links to its public source code. | 8 | Pass |
| See LICENSE. | 2 | Pass |

Terminology remains consistent: **health export** is input, **sample data** is the demo input, **cleaned copy** is the output, **cleaned CSV** is the file in the ZIP, and **date range** is the filter. The non-AI, local-only scope matches the brief; no AI, sync, or extra import is an implied missing capability.

## Demo and sandbox verification

The first-screen **Try it with sample data** link opened `/demo` in one click. At 390 px it immediately scrolled to a configured realistic `sample-health-export.csv`: three dated wearable records, a source card, a receipt showing **3 rows kept** and **3 fields removed**, and the preview controls. The fixed banner was present with **Demo — sample data, nothing is saved**, **Reset demo**, and **Clean my own file**. Both controls had 44 px visible targets at the mobile viewport.

Reset restored day precision and the sample. The registered sample-demo test also verified `/demo` and `?demo=1`, the `demo:health-export-cleaner` IndexedDB namespace, absence of the real namespace in a fresh demo context, and deletion of demo preferences when leaving. The local-processing test intercepted the demo flow, found no fetch/XHR/WebSocket request, and verified a sentinel health value was absent from IndexedDB and Cache Storage. The offline-reload test waited for the worker, set the context offline, reloaded `/demo`, and retained the sample. No demo/sandbox finding was identified.

## Claims verification

A new shallow clone of the specified GitHub repository resolved to `0fcbfbca2222261405c3e005eb97e1b947ae6c10`; `npm ci` completed with zero vulnerabilities. Each of these 18 claim commands was run separately in that clone and passed:

`sample-demo`, `supported-sources`, `no-setup`, `free-source`, `first-party-runtime`, `local-processing`, `offline-reload`, `identifier-removal`, `minimization-controls`, `csv-conventions`, `apple-record-scope`, `clean-package`, `safety-limits`, `removal-receipt`, `strict-parser`, `preference-portability`, `update-ready`, and `designed-404`.

Each was invoked as `npm run test:e2e -- --grep @claim:<id>`. The complete live suite was then run with `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`: 28/28 passed. `npm run lint`, `npm run test:unit` (31/31), and `npm run build` also passed in the clean clone. The built main JavaScript was 9.27 kB gzip.

Live copy was cross-checked against `.factory/claims.json`. All claim-like landing and README statements map to a listed claim except F-2-1.

## Earlier findings: confirmed fixed

Every earlier report and handoff was read: `review-1.md`, `polish-1.md`, and `handoff.md`. The live site and current source confirm all previous findings are actually fixed, rather than merely marked fixed.

| Earlier finding | Confirmation |
| --- | --- |
| F-1-1 | Day helper reads **“day only”**; no “safest” claim remains. |
| F-1-2 | Update text is **“An update is ready.”** and `update-ready` is registered and passed. |
| F-1-3 | README contains no unregistered runtime-key/services sentence. |
| F-1-4 | `designed-404` is registered; live unknown route returned styled HTTP 404. |
| F-1-5 | Privacy navigation and Back focused the destination `h1`; route status is present. |
| F-1-6 | Home, legal pages, and 404 share wordmark, nav, local badge, footer, maker, and version. |
| F-1-7 | External source link says **“Source code on GitHub (external site)”**. |
| F-1-8 | UI and README consistently use **cleaned copy**; the container is named download ZIP. |
| F-1-9 | User-facing filter language consistently says **date range**. |
| F-1-10 | UI, README, terms, and output use **file details and risk note**, not provenance. |
| F-1-11 | README parser description uses plain broken-file and size/record-limit wording. |
| F-1-12 | Declaration error explains what happened and tells the visitor to export again. |
| F-1-13 | Demo exit says **Clean my own file** and clears the demo database. |
| F-1-14 | Header-only CSV error now supplies its concrete next step. |
| F-1-15 | Missing-HealthData error now supplies its concrete next step. |
| F-1-16 | README says **browser checks**, not browser matrix. |

## Structure, routes, and identity

Live checks found `/`, `/demo`, `/?demo=1`, `/privacy/`, and `/terms/` at HTTP 200 and an unknown route at HTTP 404. Each page has one `h1`, a meta description, canonical URL, social image, favicon, and no application console error. Titles were:

- `Health Export Cleaner — minimize health files locally`
- `Demo — Health Export Cleaner`
- `Privacy — Health Export Cleaner`
- `Terms — Health Export Cleaner`
- `Page not found — Health Export Cleaner`

The `/demo` title/canonical changed correctly, and Privacy then browser Back focused each destination heading. Every landing link returned HTTP 200, including the labelled GitHub external link. The designed 404 has a usable home path. Header/footer chrome is consistent across routes.

The concrete-and-moss workshop system is visibly distinct: hard rules, stamped labels, the generated sorting-bench illustration, dense working controls, and no generic gradient hero or feature-card layout. It follows the required information sequence while remaining specific to minimising health exports.

## What would make this perfect

Register and test the Exact timestamp behavior described in F-2-1 (or remove that option). Then rerun the dedicated new claim command and the full suite. With that contract gap closed, this review has no remaining finding.
