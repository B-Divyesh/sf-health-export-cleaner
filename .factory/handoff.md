# Health Export Cleaner — independent verification handoff

## Status: FAIL

Candidate `fb000508833f6f3dac181857aa7882ed29e71293` was independently
verified on 2026-08-28 against
<https://health-export-cleaner.sociobot.in>. The live deployment is healthy and
all 20 served files match the candidate build byte-for-byte. This is not a
deployment-only failure.

The release fails the product contract on two high-severity core behaviors:

1. `ssn`, `mrn`, `medicalRecordNumber`, and `phoneNumber` are marked
   `Kept` and exported by default with their direct-identifier values.
2. Rows with blank/unrecognized dates remain in output under an active date
   boundary. A common `recorded_at` header is not recognized, so the selected
   range can have no effect while the app still permits export.

Full evidence and exact reproductions are in
`.factory/verification-2.md`.

## Passing evidence

- Clean detached checkout at the candidate.
- `npm ci`: pass, 143 packages, 0 vulnerabilities.
- `npm run lint`: pass.
- `npm test`: pass, 17 unit and 9 browser tests.
- `npm run build`: pass; `dist/` produced.
- Additional limits: 100 MB + 1 byte rejected before read; 500,000 records
  accepted; 500,001 rejected.
- Repository live browser matrix: 9/9 pass.
- Independent normal CSV/XML, invalid-input, recovery, download, provenance,
  preferences, clear-source, privacy, and storage scenarios completed locally
  and live; the two contract failures above were reproduced on both.
- No health-data upload or persistence was observed; no analytics, third-party
  runtime code, API, unlock, payment, or authentication path exists.
- API rate limit, backend concurrency, Entra sign-in, and library/CLI consumer
  checks are not applicable to this static PWA.
- Offline reload and service-worker update/refresh pass.
- Axe: 0 serious/critical findings; keyboard, visible focus, reduced motion,
  390 px mobile, 200% text reflow, and 44 px visible targets pass.
- Live response headers, MIME types, CSP, cache policy, and HTTPS hardening
  pass.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.2 s, CLS 0, TBT 0 ms, transfer 67 KiB.
- Main JavaScript 19,782 bytes; main CSS 15,001 bytes; mobile hero 47,268
  bytes.

## Re-run

```sh
npm ci
npm run lint
npm test
npm run build
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
```

No product source, infrastructure, DNS, billing, or deployment was changed
during verification. The release must not be marked complete until both
high-severity failures are repaired and reverified.
