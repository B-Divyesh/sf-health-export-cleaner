# Independent product re-verification — FAIL

## Scope and verdict

- **Verdict: FAIL**
- Candidate: `fb000508833f6f3dac181857aa7882ed29e71293`
- Live URL: <https://health-export-cleaner.sociobot.in>
- Verified: 2026-08-28 08:45–08:57 UTC
- Environment: Node.js `v22.23.2`, npm `10.9.8`, Playwright
  `1.58.2`, Playwright Chromium revision `1208`

The deployment is healthy and byte-for-byte matches the candidate. This is not
a deployment-only failure. The candidate fails the researched brief's central
data-minimization job in two independently reproduced cases: it exports several
ordinary direct identifiers by default, and it retains rows that cannot be
proven to fall within the selected date boundary.

No product code was modified. Temporary independent QA tests were removed after
execution, leaving the detached candidate checkout clean.

## Release-blocking defects

### HEC-V2-1 — High — ordinary direct identifiers are kept and exported by default

**Contract:** remove identifiers and fields the user did not intend to
disclose. The landing copy says “Precise location and common identifiers are
blocked before anything leaves your device,” and the README says common
identifiers are always removed.

**Reproduction on both the local production build and live deployment:**

1. Upload:

   ```csv
   type,date,value,ssn,mrn,medicalRecordNumber,phoneNumber,fullName
   HeartRate,2026-08-28,72,111-22-3333,MRN-42,MED-7,+1-202-555-0100,Jane Doe
   ```

2. Review field states and download the default package.

**Observed:** `ssn`, `mrn`, `medicalRecordNumber`, and `phoneNumber`
are enabled, selected, and labeled `Kept`. The default downloaded CSV
contains `111-22-3333`, `MRN-42`, `MED-7`, and
`+1-202-555-0100`. `fullName` is correctly locked out.

**Expected:** these familiar direct-identifier fields must be locked out by
default and absent from the cleaned CSV.

**Impact:** a user relying on the product's central safety promise can disclose
a government identifier, medical-record identifier, and telephone number in a
file presented as minimized. The general residual-risk warning does not cure a
false default for plainly named identifier columns.

### HEC-V2-2 — High — date boundaries fail open for missing or unrecognized dates

**Contract:** produce a bounded slice selected by date. The output receipt says
kept rows are “inside your boundary,” and the provenance note records the
chosen date boundary.

**Reproduction A on local and live:**

1. Upload:

   ```csv
   type,date,value,notes
   HeartRate,2026-08-20,72,inside
   HeartRate,,999,UNDATED-ROW
   HeartRate,2026-08-22,65,outside
   ```

2. Set both From and Through to `2026-08-20`.
3. Download the package.

**Observed:** the app reports `2 rows`, retains `UNDATED-ROW`, and writes a
provenance boundary of `2026-08-20 through 2026-08-20`. Only the explicitly
out-of-range dated row is omitted.

**Reproduction B:** upload
`recorded_at,value\n2026-08-28T12:00:00Z,8`, then choose
`2026-08-29` through `2026-08-30`.

**Observed:** `recorded_at`, a common timestamp header, is not recognized.
The source span says `Not detected`, the selected range has no effect, and
the row remains in the output.

The interface does disclose that undated rows stay in the copy, but it offers
no way to exclude just those rows and still describes retained rows as inside
the boundary. For a privacy-first minimizer, ambiguous dates must fail closed
or block export with an actionable choice. The current behavior cannot produce
the brief's bounded slice for a partially dated file or a CSV using this common
header.

## Clean checkout, install, tests, and build

The executable verification ran from a separate detached clone at the exact
candidate. It began and ended with no tracked or untracked changes.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 143 packages installed; audit found 0 vulnerabilities |
| `npm run lint` | PASS | ESLint completed with 0 errors |
| Type check | PASS | `tsc --noEmit` completed through the build script |
| `npm test` | PASS | 17/17 Vitest tests and 9/9 Chromium E2E tests |
| `npm run build` | PASS | exact production build emitted `dist/` |
| Additional parser boundaries | PASS | 100 MB + 1 byte rejected before read; 500,000 rows accepted; 500,001st row rejected |
| Live repository E2E matrix | PASS | 9/9 tests against the deployed URL |
| Library/CLI consumer pack | N/A | static browser PWA; no published package or CLI |
| Backend concurrency/health | N/A | no application backend |

Production sizes:

- main JavaScript: 19,782 bytes / 7.65 KB gzip (budget ≤200 KB);
- main CSS: 15,001 bytes / 4.28 KB gzip (budget ≤50 KB);
- runtime fonts: none;
- mobile hero WebP: 47,268 bytes (budget ≤300 KB);
- complete `dist/`: 530,992 bytes.

## Functional and boundary coverage

### Passing normal workflow

- Uploaded three CSV rows spanning two record types and both inclusive date
  edges.
- Applied an upper date boundary, excluded one record type, changed timestamp
  precision to hour, removed a user-selectable notes field, and reviewed the
  live receipt.
- Downloaded and decoded the ZIP. It contained exactly the cleaned CSV and
  provenance note; the retained timestamp was `2026-08-20 23:00`; excluded
  type/date rows and recognized source/device/GPS/route/user/email values were
  absent.
- The provenance note recorded source, counts, range, record types, fields,
  timestamp precision, format limits, and the explicit
  “Minimization is not anonymization” warning.

### Apple Health XML

- Parsed an entity-containing Apple Health `<Record>`.
- Confirmed `sourceName`, `sourceVersion`, and `device` were locked out.
- Confirmed timestamp reduction and the visible warning that `<Workout>`
  elements are omitted.
- Unrelated XML, `HealthData` without supported records, and malformed source
  cases were rejected with actionable messages.

### Invalid input and recovery

- Empty file: rejected.
- Header-only CSV: rejected.
- Unclosed quoted CSV field: rejected.
- Unrelated XML: rejected.
- Apple Health XML without `<Record>`: rejected with format-limit copy.
- CSV without a type column: accepted as `CSV record` with a visible warning.
- 100 MB + 1 byte: rejected before parsing.
- 500,000 records: accepted; 500,001 records: rejected.
- Reversed range: alert shown, both fields marked invalid, export disabled;
  correction restored the workflow.
- No types and no fields: distinct actionable messages and disabled export.
- Remove-source cancellation preserved the file; confirmation cleared it; a
  valid sample then recovered normally.
- Preference export produced JSON; invalid preference import produced the
  documented alert.

The two failing privacy/boundary cases are documented above rather than hidden
among the passing recovery checks.

## Privacy, network, authentication, and rate limiting

- Every observed first-load/runtime request was same-origin.
- Uploading fixtures containing `SECRET-HEALTH` and `SECRET-ID` caused
  zero requests after upload.
- Reload cleared the in-memory source.
- Local Storage and Session Storage were empty. IndexedDB contained only
  `{"timePrecision":"day"}`; Cache Storage contained only static same-origin
  URLs. No health value, source filename, date selection, or record content
  was present.
- Source and built-output inspection found no analytics, trackers, third-party
  fonts/scripts, product-unlock call, payment integration, runtime API, or
  authentication code.
- Authentication / Microsoft Entra authority validation is not applicable:
  the product has no sign-in.
- API rate-limit testing is not applicable: the static PWA exposes no
  application or unlock endpoint. `POST /` returns `405`; there is no API
  target against which a 429 threshold could legitimately be measured.

Local processing and non-retention pass. HEC-V2-1 concerns unsafe cleaned
output, not network exfiltration.

## Accessibility, responsive behavior, and visual QA

- `/opt/fleet/lib/verify-url.sh` passed live: HTTPS 200, title, `lang="en"`,
  one `h1`, `main`, complete image alt text, no unlabeled buttons, and no
  console/page errors.
- Playwright Axe scans of the empty cleaner, configured cleaner, Privacy, and
  Terms found **0 serious / 0 critical** violations.
- Keyboard-only use reached and operated the skip link, file input, sample,
  cleaner controls, and download without a trap.
- Focus used the designed 3 px outline; the skip link moved focus to
  `#main`.
- Desktop and fresh 390 × 844 mobile layouts were visually reviewed in empty
  and configured states. There was no horizontal document overflow or dead
  space after the footer.
- Visible buttons, date controls, checkbox/radio rows, wordmark, and footer
  links met the 44 px target requirement at 390 px.
- At a simulated 200% root text size, the 390 px layout retained reflow without
  horizontal document overflow.
- With `prefers-reduced-motion: reduce`, smooth scrolling became `auto` and
  animation duration fell to `0.00001s`.
- The single-mode concrete-and-moss system matches the documented visual
  thesis and remains legible. Original generated-image provenance is recorded.

## PWA, offline, and update behavior

- Manifest parsed with standalone display, versioned start URL, theme and
  background colors, 192/512 icons, and a maskable icon.
- The service worker registered and controlled the live page.
- After online installation/reload, a forced offline reload rendered the full
  cleaner; the safe sample still produced three rows.
- Update simulation installed a changed worker URL, displayed the in-app update
  toast, waited for the user action, then activated and reloaded after
  `Refresh now`.
- Cache names are versioned; the worker claims clients and deletes obsolete
  caches on activation.

## Live identity, headers, and caching

All 20 served production files matched local `dist/` byte-for-byte
(20 matched, 0 mismatched; the Azure deployment configuration is not a served
artifact).

Representative SHA-256 hashes:

- `/`: `908939ee70953e0e6115f3711377861bf34280809c65d0220ec0ea0e08feba96`
- `/assets/main-CaRT_T1Q.js`:
  `98fa8fc631019483b43ed7d325be626558ef2a660517362a63ea515032ab6a5a`
- `/sw.js`:
  `676d33d7628a49c8d06cecce9cbab6d46a1a1d058973f2c606eeb84893b95e46`

Live responses provide:

- enforcing same-origin CSP with `frame-ancestors 'none'`;
- `X-Frame-Options: DENY`, HSTS, `nosniff`, Referrer-Policy, and a
  restrictive Permissions-Policy;
- `application/manifest+json` and `image/avif` content types;
- `public, max-age=31536000, immutable` for `/assets/*`;
- `no-cache, no-store, must-revalidate` for `/sw.js`;
- five-minute revalidation for the manifest and 30-second revalidation for
  HTML.

## Performance

Lighthouse 12.8.2, live URL, mobile profile:

| Category/metric | Result |
| --- | --- |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.2 s |
| Speed Index | 0.9 s |
| CLS | 0 |
| Total Blocking Time | 0 ms |
| Max potential input delay | 20 ms |
| Initial transfer | 67 KiB |

No field INP data exists for this deployment; TBT and max potential input delay
are both comfortably below the 200 ms interaction budget.

## Required remediation

1. Treat `ssn`, `mrn`, `medicalRecordNumber`, `phoneNumber`, and common
   spelling/case/separator variants as locked sensitive fields. Add package-level
   regressions proving names and values are absent from the actual downloaded
   CSV, not only from a helper result.
2. Fail closed when a date boundary is active: exclude undated/unparseable rows,
   or block export and give the user an explicit include/exclude decision.
   Recognize common headers such as `recorded_at`; report ambiguous-row counts
   in the receipt and provenance.
3. Re-run the exact clean install/test/build, both adversarial fixtures, the
   live deployment hash comparison, offline/update checks, Axe, response
   policies, and Lighthouse.
