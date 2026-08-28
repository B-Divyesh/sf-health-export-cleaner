# Health Export Cleaner — build handoff

## What shipped

- A responsive Vite + vanilla TypeScript PWA at `dist/index.html`.
- Local CSV and Apple Health XML inspection with explicit 100 MB and 500,000
  record safety limits, malformed-input errors, quoted CSV support, XML entity
  decoding, and source-format warnings.
- Date-range and record-type filtering, user-selectable safe fields, mandatory
  blocking of common identifiers/device/location/GPS/route fields, and exact,
  hour, or day timestamp precision.
- Live output counts, a five-row cleaned preview, removal receipt, residual-risk
  warning, and one ZIP download containing the cleaned CSV plus a plain-text
  provenance note.
- No health-record persistence or network processing. IndexedDB stores only the
  timestamp-precision preference; preferences can be exported/imported as JSON.
- Installable manifest, 192/512/maskable icons, versioned service-worker caches,
  navigation fallback, explicit offline state, and an in-app update prompt.
- `/privacy/` and `/terms/` pages, robots/sitemap, MIT license, and expanded
  README.
- Product-specific concrete-and-moss visual system and reviewed original hero
  artwork. The source prompt and provenance are in `.factory/design.md` and
  `assets/src/sorting-bench.json`; AVIF, WebP, and JPEG derivatives ship under
  `public/assets/`.

## Verification

Run from a clean checkout with Node.js 20+:

```sh
npm ci
npm test
npm run build
```

Verified on 2026-08-28:

- `npm test`: 10 unit tests and 4 Chromium end-to-end tests passed.
- End-to-end coverage includes sample cleaning/download, mandatory field
  removal visibility, 390 × 844 mobile layout, Axe scans in empty/configured
  states, and a service-worker-controlled offline reload followed by cleaning.
- The generated ZIP was separately tested with `unzip -t`; both the cleaned CSV
  and provenance note passed integrity checks and their contents were reviewed.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 …`: HTTP 200, no console or
  page errors, one `<h1>`, `lang="en"`, a main landmark, and zero images missing
  alt text.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.5 s, CLS 0, Total Blocking Time 10 ms, max potential input
  delay 60 ms.
- Production main bundle: 18.2 KB JS and 14.8 KB CSS uncompressed. Hero: 67 KB
  AVIF, 121 KB desktop WebP, 47 KB mobile WebP, and 213 KB JPEG fallback; no
  downloaded fonts or third-party runtime resources.

## Known limits

- Apple Health XML v1 reads `<Record>` elements only. It intentionally omits
  workouts, workout routes, clinical records, ActivitySummary, and nested
  metadata, and reports this when present.
- Parsing is in-memory and deliberately rejects files over 100 MB or 500,000
  records. Very large Apple Health archives should be split before use.
- CSV field detection is name-based. Vendor-specific sensitive columns and
  identifying free text may evade automatic blocking, so the UI and provenance
  note require a human review and never claim anonymization.
- The utility emits normalized CSV rather than recreating vendor-specific XML.

## Suggested next steps

- Validate type/date aliases against additional real vendor export fixtures.
- Move parsing to a Web Worker and add streaming output if the supported file
  ceiling needs to grow.
- Add optional first-party page-count telemetry only after a privacy review; v1
  intentionally ships with none.
