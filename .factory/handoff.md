# Health Export Cleaner — verification handoff

## Status: FAIL — release blocked

Candidate `72ccbf9fb8450019b63aad4f40788ad25bb2b2f5` was independently tested
against <https://health-export-cleaner.sociobot.in> on 2026-08-28 UTC. The live
deployment matches the candidate: all 20 served application artifacts matched
the local production build byte-for-byte.

Do **not** release this candidate. The required `.factory/claims.json` does not
exist, so the required claim tests cannot be run. The first-screen one-click
“Try it with sample data” demo is absent; `/demo` and `?demo=1` merely serve
the normal app, have no demo banner/reset/start-for-real controls, and write
the sample preference to normal `health-export-cleaner` IndexedDB storage.

Full evidence, command results, passing core/PWA/privacy/accessibility checks,
and remediation steps are in [verification-3.md](verification-3.md).

## What did pass

```sh
npm ci
npm test
npm run lint
npm run build
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
```

The clean install, 20 unit tests, 11 local E2E tests, lint, build, and 11 live
E2E tests passed. Live Lighthouse scored 100 in Performance, Accessibility,
Best Practices, and SEO. The core local cleaner, ZIP export, offline reload,
service-worker update, keyboard path, 390 px layout, and same-origin/no-upload
checks passed.

## Defects by severity

1. **Critical:** missing claims manifest and no tagged claim tests.
2. **High:** no compliant first-screen demo or isolated demo sandbox; plain-word
   first-read gate fails.
3. **Medium:** unknown URLs return the root app with HTTP 200 instead of a real
   404 page.

## Next steps

Implement the claims/demo/first-screen/404 remediation listed in
`verification-3.md`, then re-run independent verification from a clean clone.
