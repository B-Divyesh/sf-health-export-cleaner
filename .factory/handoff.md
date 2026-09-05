# Verification 8 handoff

## Status

**PASS.** Independent verification found zero product findings and zero
untested public claims for the live Health Export Cleaner.

- Implementation: `714134a8a37b265e1ad94b12d652c5fcdab9ddfb`
- Documentation: `1c00a90af4a189f2c3711a09d2d9b4195356d648`
- Live URL: <https://health-export-cleaner.sociobot.in>
- Full report: [.factory/verification-8.md](verification-8.md)

## What was verified

- Clean setup: `npm ci`, `npm run lint`, `npm run build`, and `npm test` all
  passed. The test count was 31 unit/contract and 29 browser checks.
- Every one of the 19 separate commands in `.factory/claims.json` passed.
- The deployed live suite passed 29/29. The demo reset/exit storage-race claim
  passed five repeated live runs and preserved a seeded real preference
  byte-for-byte.
- Fresh 1440 × 900 desktop and 390 × 844 phone pages made the job, wearable
  audience, and sample action clear before scrolling. The one-click sample,
  persistent demo label, reset, and cleaned output all worked.
- All 26 live served artifacts matched `dist/` by SHA-256. The deployment
  configuration is not a public file and correctly returned 404.
- Live browser checks covered axe, keyboard/focus, mobile, reduced motion,
  privacy, offline/update, legal pages, titles, links, manifest, and HTTP 404.

## How to verify again

```sh
npm ci
npm run lint
npm run build
npm test
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in \
  npm run test:e2e -- --grep @claim:sample-demo --repeat-each=5
```

Run every `test` command listed in `.factory/claims.json` separately for the
claims gate. Evidence from this verification is under
`.factory/evidence/verification-8/`.

## Known gaps

None. This is a static local-first PWA; backend tenant, restart, health, and
429 checks do not apply because no product backend or API exists.
