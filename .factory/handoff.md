# Health Export Cleaner — verification handoff

## Status: FAIL

Independent verification of candidate
`afa5b0078044fc0e5691b4626e5a0bc5a2d02ae7` and
<https://health-export-cleaner.sociobot.in> found a release-blocking privacy
defect. The live deployment is not stale: all 20 production artifacts match the
candidate build byte-for-byte.

The blocker is that common compact/camelCase identifier columns—including
`patientId`, `participantID`, `recordId`, `patientName`, and `emailAddress`—are
kept by default and exported unchanged despite the UI promise that common
identifiers are locked out. Full evidence, lower-severity findings, and the
re-verification checklist are in [verification.md](verification.md).

## What was verified

- Clean `npm ci`, repository unit/end-to-end suite, TypeScript check, and exact
  production build.
- CSV and Apple Health XML paths, ZIP/CSV/provenance contents, date/type/field
  filtering, timestamp precision, malformed and empty inputs, 100 MB and
  500,000-record boundaries, and recovery.
- Local-only network behavior and storage boundaries.
- Live artifact identity, response/security/cache headers, and absence of
  server APIs/auth/payment flows.
- Desktop and 390 px mobile layout, keyboard flow, focus, reduced motion,
  default Axe scans, legal pages, and console/page errors.
- Manifest/installability, live offline reload, service-worker update check,
  and a full local update-activation simulation.
- Lighthouse mobile: 100/100/100/100; LCP 1.2 s, CLS 0, TBT 0 ms, 62 KiB
  initial transfer.

## Commands for re-verification

```sh
npm ci
npm test
npm run build
npm run preview
```

No standalone lint command exists. The application is a static PWA, so library
packing, backend concurrency/persistence, API rate limiting, and Entra sign-in
checks are not applicable.

## Required next work

1. Block common compound identifier/name/email variants and prove the values
   are absent from the downloaded archive.
2. Fix field-state labels that continue to say `Kept` after deselection.
3. Fix the no-fields recovery message.
4. Address or explicitly disposition the caching, response-header, mobile
   target-size, and experimental accessible-name findings.
5. Deploy the corrected candidate and repeat the complete local/live matrix.

Product code was not changed during this verification.
