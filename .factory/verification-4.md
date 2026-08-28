# Independent verification 4 — FAIL

**Candidate:** `be3bf76419358f0053595618a7770e3ba83b5131` (`main`)

**Live URL:** <https://health-export-cleaner.sociobot.in>

**Verified:** 2026-08-28 UTC from a clean, initially unmodified checkout.

## Release decision

**FAIL — do not release this candidate.** The repaired demo, declared claim
tests, core cleaner, accessibility automation, production build, and live
deployment all work. However, the candidate fails the explicit cold first-screen
gate on a normal desktop viewport, carries a source filename into the artifact
the user shares, and has material claims not registered in the required claims
contract. The PWA offline fallback also violates its CSP and is not actually
used for an uncached offline route.

No product code was modified during this verification.

## Release-blocking defects

### HEC-QA4-1 — Critical — the first-screen sample action is below the fold on desktop

The words themselves are clear: the page says it cleans a health export before
sharing, names wearable users, and eventually offers **Try it with sample
data**. The layout does not keep the action on the first screen:

| Cold viewport | Sample action | Result explanation | Three facts |
| --- | --- | --- | --- |
| 1366×768 | y=811.5–863.5, entirely below viewport | y=879.5 | y=930.3 |
| 1280×720 | y=706.5–758.5, clipped | y=774.5 | y=825.3 |
| 1440×900 | visible at y=811.5 | clipped at bottom | below viewport at y=930.3 |
| 390×844 | visible at y=538 | visible | visible |

At 1366×768 the cold first screen answers what the product does and who it is
for, but it does not show what to click first. This directly triggers the work
order's mandatory first-read failure condition and the attached plain-words and
demo-sandbox requirements. Screenshot:
`/tmp/first-read-1366x768.png` in this verification worker.

### HEC-QA4-2 — High — the cleaned package repeats personal source filenames

Uploading a valid file named `Jane Doe personal health.csv` correctly removed
`patientId`, `latitude`, and their values from the cleaned CSV. The download was
nevertheless named:

```text
Jane-Doe-personal-health-cleaned-package.zip
```

The bundled provenance note also contained:

```text
Source file: Jane Doe personal health.csv
```

The package filename is visible to a recipient and the provenance note is one
of the two files the product tells the user to share. Neither disclosure appears
in the on-screen removal receipt or preview. This conflicts with the researched
job of removing identifiers from a bounded shareable copy. The honest
non-anonymization warning does not make this hidden propagation necessary.

### HEC-QA4-3 — High — material visitor claims are absent from `claims.json`

All six declared claims have exactly one matching tag and pass. Cross-checking
the landing page and README found additional material claims with no manifest
entry and therefore no required `@claim:<id>` test:

- “limited to 100 MB / 500,000 records for safety” and “maximum 100 MB”;
- “preview the result and the exact number of removed rows and fields”;
- “The parser uses structural limits and rejects malformed quoted CSV input or
  unrelated XML.”

Some behavior is incidentally covered by ordinary tests, and independent
probing confirmed the stated record/file limits. That does not satisfy the
claims contract, which requires every claim to be listed and run through its
declared command. The attached claims contract explicitly makes any unlisted
claim a failed review.

### HEC-QA4-4 — Medium — the offline fallback is blocked by CSP and never selected

`/offline.html` contains an inline `<style>`, while the deployed policy is
`style-src 'self'`. A cold live load produces this browser error and renders
without the intended styling:

```text
Applying inline style violates Content Security Policy directive
“style-src 'self'”. The action has been blocked.
```

In addition, the service worker's navigation failure branch chooses cached `/`
before `/offline.html`. After installation, requesting an uncached path while
offline returned the root cleaner with HTTP 200 and title **Health Export
Cleaner — minimize health files locally**; the fallback heading **The bench is
still here** was absent. The required offline fallback page is effectively dead.
Root and `/demo` offline reloads themselves passed.

## Other contract defects

### HEC-QA4-5 — Medium — required route metadata and footer identity are incomplete

Live inspection of `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html` found
no canonical link, Open Graph title/image, Twitter card, or Apple touch icon.
There is no product-derived 1200×630 social image. Footers do not expose a
version/build identifier, and the legal/404 footers omit the standard Privacy,
Terms, and Param Factory links. The footer also does not disclose generated
imagery despite `.factory/design.md` saying that it does. These are mandatory
site-structure and asset-provenance items.

### HEC-QA4-6 — Low — the copy audit is not the required complete extraction

`.factory/copy-audit.md` counts the eight first-screen strings, then states that
all other landing sentences are compliant without listing them. The attached
plain-words contract requires every landing sentence to be extracted with a
word count. This makes the artifact incomplete even though no banned-word or
over-22-word issue was observed in the first screen.

### HEC-QA4-7 — Low — immutable caching includes unhashed image filenames

The deployed `/assets/*` rule applies `max-age=31536000, immutable` to stable
names such as `sorting-bench-768.webp` and `sorting-bench-1280.avif`. Those files
are not content-hashed, so a future replacement at the same URL can remain stale
for a year. JavaScript and CSS filenames are content-hashed and are safe under
this policy.

## Mandatory claims gate

`.factory/claims.json` exists, is valid, and contains six entries. Every command
was run separately before repository inspection. Each command used the local
production build and `/demo` entry point.

| Claim | Exact command | Result |
| --- | --- | --- |
| `sample-demo` | `npm run test:e2e -- --grep @claim:sample-demo` | PASS, 1 test |
| `supported-sources` | `npm run test:e2e -- --grep @claim:supported-sources` | PASS, 1 test |
| `local-processing` | `npm run test:e2e -- --grep @claim:local-processing` | PASS, 1 test |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS, 1 test |
| `identifier-removal` | `npm run test:e2e -- --grep @claim:identifier-removal` | PASS, 1 test |
| `clean-package` | `npm run test:e2e -- --grep @claim:clean-package` | PASS, 1 test |

Tag audit found exactly one occurrence of each declared `@claim:<id>` and no
undeclared claim tags.

## First-read record

On a cold visit, the page reads as follows:

- **What it does:** cleans a health export before it is shared and reduces
  identifiers/location details.
- **For whom:** wearable users who need a smaller health file to share.
- **What to click first:** **Try it with sample data**, which says it will show
  a cleaned sample immediately.

The semantic answer is good and the sample works in one click. The desktop
layout still fails because the action is not present in the initial 1366×768
viewport; see HEC-QA4-1. At 390×844, all three answers and the action are visible.
After activation, `/demo` immediately shows three realistic records plus the
persistent **Demo — sample data, nothing is saved**, **Reset demo**, and **Start
for real** controls. Direct `/demo` use creates only the
`demo:health-export-cleaner` preference namespace, and starting for real clears
the demo preference.

## Clean checkout and repository gates

| Check | Result | Evidence |
| --- | --- | --- |
| Candidate/clean tree | PASS | `HEAD` exactly matched the requested SHA; `git status --porcelain` was empty. |
| `npm ci` | PASS | 143 packages installed; audit reported 0 vulnerabilities. |
| `npm test` | PASS | 20/20 Vitest and 14/14 Playwright tests passed. |
| `npm run lint` | PASS | ESLint completed with no errors. |
| Type check | PASS | `tsc --noEmit` ran as the first build step. |
| `npm run build` | PASS | Vite emitted `dist/`; exact production command passed. |
| Live browser suite | PASS | `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`: 14/14 passed. |

The build emitted 20.80 kB main JavaScript (7.92 kB independently gzipped),
0.71 kB preload JavaScript (0.40 kB gzip), and 15.77 kB main CSS (4.41 kB
gzip). The mobile hero WebP is 47.27 kB. There are no runtime fonts. All are
well within the stated budgets.

## Independent functional and boundary testing

- **CSV:** sample and custom CSVs were filtered by dates/types/fields; day/hour/
  exact precision, empty selections, reversed dates, ZIP generation, CSV
  escaping, removal receipts, and recovery all worked.
- **Apple Health XML:** a two-Record file plus a Workout parsed as two records;
  the Workout warning appeared; a one-day boundary produced one row; source,
  device, and latitude fields were removed; the ZIP contained both CSV and
  provenance files with the documented XML limits.
- **Invalid input:** empty CSV, headers-only CSV, an unclosed quoted field, and
  unrelated XML each produced a specific actionable error. Loading the sample
  after each error recovered normally.
- **Limits:** 100 MB + 1 byte was rejected before parsing; 500,001 rows were
  rejected with the stated message; exactly 500,000 rows were accepted and
  became downloadable (5.53 s on this worker).
- **Preferences:** exporting `exact` produced valid version-1 JSON; malformed
  import showed recovery guidance; importing `hour` selected that precision.
- **No-output states:** reversed dates, zero record types, and no useful output
  disable download and explain the corrective action.

## Accessibility, responsive behavior, and browser health

- `/opt/fleet/lib/verify-url.sh` passed live HTTPS, title, `lang="en"`, one
  `<h1>`, `<main>`, image alternatives, labelled buttons, and browser errors;
  measured navigation was 630 ms.
- `@axe-core/cli` 4.10.2 (axe-core 4.10.3) with a matching Chrome/ChromeDriver
  found **0 violations** on home, Privacy, and Terms under WCAG 2 A/AA and
  WCAG 2.1 A/AA. The in-repository configured/empty Axe test also passed.
- Keyboard-only cleaning and download passed. Focus uses a visible 3 px moss
  outline; the skip link works; there was no trap.
- At 390×844 the configured cleaner had zero page-level horizontal overflow.
  Increasing root text to 200% also had zero page-level overflow. Label-backed
  checkbox/radio targets and all standalone visible actions met the 44 px target.
- Reduced motion computed to `scroll-behavior: auto`, one animation iteration,
  and 0.01 ms animation durations. No console or page errors occurred in the
  main custom flow. `/offline.html` is the exception documented above.

## Performance and deployment identity

Fresh Lighthouse 12.8.2 mobile-profile results on the live root:

| Category/metric | Result |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1.1 s |
| LCP | 1.2 s |
| TBT | 150 ms |
| CLS | 0 |

Every one of the **22 served application files** in `dist/` matched its live
URL byte-for-byte. The deployment-only `staticwebapp.config.json` is not
directly served. Root SHA-256 was
`c4aa877919d430505c7ba0b2939aee8bab0726bbd1223f6804a8953c8daf2224`.
Unknown paths returned the candidate's `404.html` body with HTTP 404. This is
fresh evidence that the live deployment matches candidate `be3bf764...`; the
previous deployment-only concern is resolved.

## Privacy, requests, headers, and platform checks

- A full cold load requested only the product origin. Uploading a uniquely
  marked health CSV caused zero requests, and its filename/values were absent
  from Cache Storage and IndexedDB. Reload cleared records.
- Source audit found no analytics, third-party scripts/fonts, runtime API,
  unlock/billing call, authentication, or remote processing client.
- Live headers include HSTS, same-origin CSP with `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, `nosniff`, restrictive Permissions-Policy, and
  Referrer-Policy. Root caching is 30 seconds; hashed assets are one-year
  immutable; the service worker is no-store; the manifest revalidates after
  five minutes.
- Manifest fields, standalone display, versioned start URL, 192/512 icons, and
  a maskable icon are present. Offline root/demo reload and the in-app
  service-worker update path passed on live.
- The product is static and has no server-side endpoint. `POST`, `PUT`, and
  `DELETE /` returned 405 (`OPTIONS` returned 204). An API rate-limit threshold
  and `Retry-After` test are therefore not applicable.
- The product has no sign-in. Microsoft Entra tenant validation is not
  applicable.
- Home/demo/privacy/terms and the external source link resolved; the real 404,
  `robots.txt`, and sitemap behaved as declared.

## Required remediation

1. Keep the full first-read copy, explanation, sample action, and three facts
   inside common desktop-height viewports without harming the passing mobile
   layout.
2. Generate a neutral output/package name and omit or minimize the original
   filename in the provenance note, or make its disclosure explicit and
   user-controlled before download.
3. Register the quantitative/resource and exact-receipt claims in
   `.factory/claims.json` with one tagged observable test each, or remove those
   claims from visitor/README copy.
4. Move offline styles to a permitted stylesheet and make the service worker
   return `/offline.html` for uncached offline navigations.
5. Add the required canonical/social/apple-touch metadata, social image,
   consistent footer links, build identity, and generated-image disclosure.
6. Complete the all-sentence copy audit and avoid immutable caching for
   unhashed image URLs.
