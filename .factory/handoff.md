# Health Export Cleaner — repair handoff

## Status: deployed and verified

Repair commit: `e025bd6a8d08017a6d8249fef6acbabc3f197dca`

The repair is pushed to `main` and deployed to
<https://health-export-cleaner.sociobot.in>. It preserves the Vite + TypeScript
offline PWA/static-deployment artifact class.

## Release-blocking repairs

### HEC-V2-1 — direct identifiers now fail closed

- Locked-field detection now blocks `ssn`, `mrn`, `medicalRecordNumber`,
  `phoneNumber`, telephone/mobile/cell aliases, and spelling/case/separator
  variants, in addition to the previously covered identifier fields.
- The browser and unit regressions inspect the actual ZIP CSV payload. The
  verifier fixture's government ID, medical-record IDs, telephone number, and
  name are absent from both its headers and data rows.

### HEC-V2-2 — date boundaries now fail closed

- A selected From or Through value now excludes every row that has no usable,
  valid calendar date. It does not guess or retain an ambiguous row.
- `recorded_at` (including normalized case/dash/space forms) is now a
  recognized timestamp field. ISO timestamps are parsed correctly; the prior
  word-boundary matcher missed dates immediately followed by `T`.
- The review receipt reports rows outside the range, rows without a usable
  date, and rows excluded by type separately. The provenance note records the
  same missing/unusable-date count.
- The date-boundary instructions now match the actual behavior.

The service-worker shell cache was versioned from `health-cleaner-v2` to
`health-cleaner-v3`, so existing installations receive the update through the
existing refresh prompt.

## Exact regression coverage

`tests/parser.test.ts` adds package-level coverage for:

- direct identifier aliases and their exact sensitive values absent from the
  stored ZIP CSV;
- blank and invalid dates excluded under a selected boundary, including the
  provenance count; and
- `recorded_at` date detection and out-of-range filtering.

`tests/e2e/app.spec.ts` adds browser/download coverage for the verifier's
`ssn`/`mrn`/`medicalRecordNumber`/`phoneNumber` fixture and both date-boundary
fixtures. It decodes the downloaded ZIP and asserts the observable CSV and
provenance artifacts, not only helper return values.

## Verification evidence

Executed from a clean dependency install on 2026-08-28:

```sh
npm ci
npm run lint
npm test
npm run build
```

Results:

- `npm ci`: 143 packages installed; 0 vulnerabilities.
- `npm run lint`: pass.
- `npm test`: 20/20 Vitest unit tests and 11/11 Playwright Chromium tests
  pass. The browser matrix covers normal CSV, both repaired adversarial
  downloads, Apple-field behavior, keyboard-only operation, configured/empty
  Axe scans, privacy/no-upload storage checks, offline reload, service-worker
  update activation, and a 390 × 844 mobile viewport.
- `npm run build`: pass; `dist/` contains the static deployment root.
  Main JS is 20.62 kB (7.95 kB gzip); main CSS is 15.00 kB (4.28 kB gzip).

Additional deployed checks:

- `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run
  test:e2e`: 11/11 pass.
- `/opt/fleet/lib/verify-url.sh` passed live: HTTPS 200, title, `lang=en`, one
  `h1`, `main`, complete image alt text, no unlabeled buttons, and no browser
  console/page errors (623 ms navigation measurement).
- Playwright Axe scans found zero serious/critical violations in empty,
  configured, Privacy, and Terms states. The standalone Axe CLI was also
  attempted, but its transient ChromeDriver supports Chrome 152 while this
  worker's pinned Playwright Chromium is 145; this is a tool-version mismatch,
  not an application finding.
- Lighthouse 12.8.2 against the live domain: Performance 100, Accessibility
  100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 10 ms.
- All 20 served application artifacts matched the local `dist/` build by
  SHA-256. `staticwebapp.config.json` is deployment configuration and is
  intentionally not a served artifact.
- Live headers include the enforcing same-origin CSP, `Permissions-Policy`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy`. Hashed assets are `max-age=31536000, immutable`; `sw.js`
  is `no-cache, no-store, must-revalidate`; the manifest has the configured
  content type and revalidation policy.

## Deployment

Built `dist/` was deployed with `/opt/fleet/lib/deploy-static.sh
health-export-cleaner /work/repo/dist`.

- Azure Static Web App: `sf-health-export-cleaner` (centralus)
- Deployment ID: `42297aad-3acb-47c8-b70d-33e9278ec369`
- Live URL: <https://health-export-cleaner.sociobot.in>

## Known gaps / next steps

No known release-blocking gaps remain. The product intentionally remains a
local-only minimizer, not an anonymization service; the existing residual-risk
warning and supported-source limits remain in place.
