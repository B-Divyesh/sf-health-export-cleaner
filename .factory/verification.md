# Independent product verification — FAIL

## Scope and verdict

- **Verdict: FAIL**
- Candidate: `afa5b0078044fc0e5691b4626e5a0bc5a2d02ae7`
- Live URL: <https://health-export-cleaner.sociobot.in>
- Verified: 2026-08-28 07:46–07:58 UTC
- Environment: Node.js `v22.23.2`, npm `10.9.8`, Playwright `1.58.2`

The live deployment is present and byte-for-byte matches the production build
from the candidate. This is not a deployment-only failure. The release fails
the product contract because its default sensitive-field detector retains and
exports several ordinary identifier column names, including `patientId`,
`participantID`, `recordId`, `patientName`, and `emailAddress`. Preventing that
disclosure is the product's central job.

No product source was modified during verification.

## Release-blocking defect

### HEC-V1 — High — common identifiers are included by default

**Contract:** remove identifiers and fields the user did not intend to disclose;
the UI specifically says common identifiers are “locked out.”

**Reproduction on both local production build and live deployment:**

1. Upload a CSV with headers
   `type,date,value,patientId,participantID,recordId,patientName,emailAddress,gpsCoordinates`.
2. Use a row containing `P-123,S-456,R-789,Jane Doe,jane@example.test`.
3. Inspect the field controls and download the default clean package.

**Observed:** `patientId`, `participantID`, `recordId`, `patientName`, and
`emailAddress` are checked and labeled `Kept`. Their exact values appear in the
downloaded ZIP/CSV. Only `gpsCoordinates` is locked out. This follows from the
normalization/pattern combination in `src/cleaner.ts`: camelCase is flattened
without a separator and most compound identifier/name/email variants are not
matched.

**Expected:** common identifier/name/email variants must be locked out by
default, and direct identifier values must not appear in the cleaned output.

**Impact:** a user can reasonably trust the explicit “common identifiers … are
locked out” promise and disclose direct identity data in a file advertised as a
cleaned copy. The residual-risk warning does not cure a false default about the
specific field-removal control.

## Other defects

### HEC-V2 — Medium — field controls contradict the actual removal state

After unchecking `notes`, the checkbox is unchecked and the receipt changes to
`4 fields removed`, but the same row still says `notes — Kept`. Field-state text
is created once and is not updated. This conflicts with the success criterion
that users correctly identify which fields were removed before download.

### HEC-V3 — Medium — the no-fields recovery message gives the wrong remedy

With record types selected but every available field unchecked, the download
is correctly disabled, yet the message says: “No records match this boundary.
Select at least one record type or widen the dates.” Rows do match; the user
must select at least one field. This is an incorrect recovery path for a valid
boundary state.

### HEC-V4 — Low — live static caching does not meet the immutable-asset policy

The root document, service worker, manifest, hashed JS/CSS, and images all
return `Cache-Control: public, must-revalidate, max-age=30`. Hashed assets are
not served with a long-lived immutable policy. Offline behavior still works
through the service worker, and the small first load keeps measured performance
high.

### HEC-V5 — Low — response hardening is incomplete

Live responses include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
and `X-Content-Type-Options: nosniff`. They do not include an enforcing Content
Security Policy, a `frame-ancestors` policy / `X-Frame-Options`, or a
`Permissions-Policy`. Lighthouse's CSP diagnostic reports “No CSP found in
enforcement mode.” The manifest and AVIF responses are also served as
`application/octet-stream`; Chromium nevertheless parsed the manifest with no
installability errors and rendered the image.

### HEC-V6 — Low — several mobile link targets are under 44 px tall

At 390 px, the wordmark link measured `172×34`; the Privacy, Terms, and Source
code links measured `52×22`, `42×22`, and `89×22`. This misses the work order's
44×44 CSS-pixel target guidance. Core form/button targets met the target size.

### HEC-V7 — Low — experimental accessible-name diagnostic

Default Axe scans found zero serious/critical violations. Lighthouse's
experimental `label-content-name-mismatch` rule separately flags the wordmark
as serious because visible `H//` is absent from its accessible name
(`Health Export Cleaner home`). This did not reduce the reported Lighthouse
accessibility score, but it should be resolved or deliberately exempted as a
decorative logo mark.

## Clean install, tests, and build

The checkout started clean on `main`, with `HEAD` and `origin/main` both at the
candidate.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 61 packages installed from lockfile; audit found 0 vulnerabilities |
| `npm test` | PASS | 10/10 Vitest tests and 4/4 Chromium end-to-end tests passed |
| Type check | PASS | `tsc --noEmit` is the first part of the production build |
| Lint | N/A | no lint script or lint configuration exists |
| `npm run build` | PASS | exact command completed; Vite emitted `dist/` |
| Product packaging/consumer install | N/A | static PWA, not a published library or CLI |

Production output:

- Main JS: 18,202 bytes uncompressed / 7.21 KB gzip (budget ≤200 KB)
- Main CSS: 14,771 bytes uncompressed / 4.24 KB gzip (budget ≤50 KB)
- Fonts: none
- Mobile hero WebP: 47,268 bytes (budget ≤300 KB)
- All 20 files in `dist/` were fetched from their live paths and SHA-256
  compared: **20 matched, 0 mismatched**

Representative identity hashes:

- `/index.html`: `6f8990f6a88130b04644e343de47c3574150ab2b407237479537d4d40a428ef9`
- `/assets/main-D_ekByNE.js`: `c260a35eafc1f1b562b1bbad7a8c7885736a2838cd60498e4c2fa8f1b3da0aa5`
- `/sw.js`: `0bf11cb803bff7dc177b01c76c767e66b20f9a7d7633d31d9cbe8c0e9174b60d`

## Functional and boundary coverage

Independent Playwright checks exercised the built app locally and the deployed
app. The final diagnostic run had 10/10 local scenarios pass; five core/live
scenarios also passed. Diagnostic assertions intentionally recorded HEC-V1–V3
rather than hiding those product defects behind a test failure.

### Normal CSV path

- Uploaded three records across two types with date, timestamp, value, unit,
  notes, source, device, latitude, longitude, route, user ID, and email fields.
- Confirmed supported exact boundary dates are inclusive.
- Excluded a record type and date, selected hour precision, and observed the
  preview update to `2026-08-22 23:00`.
- Confirmed the ZIP filename, both member filenames, cleaned CSV contents,
  removed values, row counts, and provenance/risk language.
- ZIP removed the explicitly recognized `sourceName`, `device`, `latitude`,
  `longitude`, `GPSRoute`, `user_id`, and `email` values.

### Apple Health XML path

- Parsed an entity-containing Apple Health `<Record>`.
- Confirmed `sourceName`, `sourceVersion`, and `device` are locked out,
  timestamps are reduced, and a colocated `<Workout>` produces the documented
  omission warning.

### Invalid input and recovery

- Empty file: rejected with actionable error.
- Header-only CSV: rejected.
- Unclosed quoted CSV field: rejected.
- Unrelated XML without `HealthData`: rejected.
- Apple Health XML without supported records: rejected with format-limit text.
- Generic CSV without a type column: accepted with a clear grouping warning.
- 100 MB + 1 byte file: rejected before parsing.
- 500,001-record CSV: rejected at the record ceiling.
- A valid file uploaded after each failure sequence recovered normally.
- Reversed date range: error shown, fields marked invalid, download disabled;
  correcting the date restored output.
- No record types: zero-output state and disabled download behaved correctly.
- No fields: download disabled, but recovery copy is wrong (HEC-V3).

## Privacy and network evidence

- First-load requests observed by Lighthouse were only the same-origin HTML,
  main JS, main CSS, and mobile hero image. Service-worker installation fetched
  only same-origin static shell assets.
- Uploading a fixture containing `SECRET-HEALTH` and `SECRET-ID` generated
  **zero network requests** after upload.
- Page memory was cleared on reload; the configured source did not return.
- IndexedDB contained only `{ "timePrecision": "day" }` in the documented
  preference store.
- Cache Storage contained only same-origin static shell URLs and no health
  value, filename, date selection, or record data.
- No analytics, trackers, third-party fonts, runtime scripts, accounts,
  product-unlock calls, or other product API endpoints were found.
- Rate-limit testing is **not applicable**: this is a static browser-only PWA
  and exposes no server-side product endpoint. POST to the static root returned
  405. Authentication/Entra validation is likewise not applicable.

The privacy architecture is local-first as claimed, but HEC-V1 makes the
cleaned output itself unsafe relative to the field-removal promise.

## Accessibility, responsive layout, and browser behavior

- `/opt/fleet/lib/verify-url.sh` passed locally and live: HTTP 200, title,
  `lang="en"`, one `<h1>`, `<main>`, image alt text, and no console/page errors.
- Default Axe checks on empty, configured, Privacy, and Terms states found
  **0 serious / 0 critical** violations.
- Desktop at 1440×1000 and mobile at 390×844 had no horizontal document
  overflow. Empty and fully configured screens were visually inspected.
- Keyboard-only smoke test reached the skip link, wordmark, file input, sample
  action, legal links, record-type actions, and download. Enter/Space operated
  the native controls and produced a download without a trap.
- Focus was visibly rendered as a 3 px moss outline. Activating the skip link
  set `#main`; the next Tab moved to the file input in main content.
- At `prefers-reduced-motion: reduce`, computed scroll behavior was `auto` and
  spinner duration was reduced to `0.00001s`.
- Core form labels, error announcements, tables, and legal landmarks were
  present. Remaining target/name findings are HEC-V6 and HEC-V7.

## PWA, offline, and update behavior

- Chromium parsed the manifest with zero manifest or installability errors;
  standalone mode, versioned start URL, 192/512 icons, and maskable icon were
  present.
- Live service worker registered and controlled the page. After an online
  reload, a forced offline reload rendered the cleaner and the safe sample
  still produced three rows.
- `registration.update()` completed on live with the candidate worker active.
- A local update simulation changed the built worker/cache version, observed
  the in-app update toast, activated only after `Refresh now`, reloaded, created
  the new shell/assets caches, and removed the old cache. The generated
  `dist/sw.js` was restored byte-for-byte afterward.

## Performance

Lighthouse 12.8.2, live URL, mobile profile:

| Category/metric | Result |
| --- | --- |
| Performance | 100 |
| Accessibility | 100 (with HEC-V7 experimental diagnostic noted above) |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.2 s |
| Speed Index | 0.9 s |
| CLS | 0 |
| Total Blocking Time | 0 ms |
| Max potential input delay | 20 ms |
| Initial transfer | 62 KiB |

Lab Lighthouse does not provide field INP for this new deployment. TBT and max
potential input delay are comfortably below the 200 ms interaction budget.

## Re-verification requirements

1. Fix HEC-V1 and add parameterized tests for camelCase, PascalCase, spaced,
   dashed, underscored, and compact identifier/name/email/device/location
   variants. Recheck the actual ZIP, not only `isSensitiveField()`.
2. Make every field row's visible state follow its checkbox and precision
   selection; list or otherwise unambiguously expose removed field names before
   download.
3. Correct the no-fields empty-state remedy.
4. Re-run clean install, full tests/build, local/live end-to-end checks, Axe,
   offline/update tests, Lighthouse, response headers, and all-file deployment
   hashes.
