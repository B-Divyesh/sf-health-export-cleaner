# Independent verification handoff — candidate 6

## Status: FAIL — do not release

**Candidate:** `6a42d313e4ecb71ea3d89572a5a52b41986231bf` (`main`)

**Verified URL:** <https://health-export-cleaner.sociobot.in>

**Date:** 2026-08-28 UTC

No product code was changed. The verification record is
`.factory/verification-6.md`.

## Release-blocking findings

- **High — HEC-QA6-1:** malformed Apple XML can keep the synchronous parser on
  the browser main thread for too long. A 680,012-byte string containing
  40,000 unclosed `<Record type="x">` starts took 8,185 ms before rejection.
  This is well below the advertised 100 MB intake limit and does not meet the
  brief's requirement to handle malformed exports safely.
- **High — HEC-QA6-2:** the text-based XML matcher accepts records inside XML
  comments and accepts an incomplete `<HealthData>` document. On production,
  a comment containing `COMMENT-ONLY-SECRET` appeared as a source record and
  in the preview. These are not valid Apple Health record semantics.
- **Medium, release-blocking — HEC-QA6-3:** the declared `strict-parser` claim
  says malformed quoted CSV is rejected, but
  `HeartRate,2026-08-28,"72"trailing-junk` is accepted and exported as
  `72trailing-junk`. The claim test covers only an unclosed quote, so the
  claim exceeds the verified behavior.

## Evidence that passed

- `npm ci` completed with 143 packages and no reported vulnerabilities.
- Every one of the 16 commands in `.factory/claims.json` passed separately
  through the demo entry point.
- `npm test` passed: 24 Vitest and 27 local Playwright tests.
- `npm run lint` and the exact `npm run build` passed; `dist/` was produced.
- The deployed 27-test Playwright suite passed. All 24 deployable local files
  matched the live response bytes by SHA-256.
- Cold live first-read passed: it plainly says it cleans a health export before
  sharing for wearable users, and the first action is **Try it with sample
  data**. One click loads the persistent isolated demo banner and sample data.
- Desktop and 390px mobile checks found no horizontal overflow; keyboard path,
  visible focus, reduced-motion handling, service-worker update/offline reload,
  privacy/network checks, and Playwright Axe serious/critical checks passed.
- `verify-url.sh` passed on production: HTTP 200, title, `lang`, one `h1`,
  `main`, image alternatives, labeled controls, and no console/page errors.
- Production headers include HSTS, same-origin CSP, `nosniff`, frame denial,
  strict referrer policy, and restrictive permissions policy. Hashed compiled
  assets are immutable; `sw.js` is no-store. There is no backend/API, account,
  payment, or sign-in endpoint, so rate-limit and Entra checks do not apply.

## Next step

Replace regex XML extraction with bounded structural parsing that ignores
comments and rejects malformed documents without prolonged main-thread work.
Validate CSV quote state after a closing quote, then either test the full
strict-parser promise or narrow that promise. Rerun all claim commands and
boundary cases before redeploying.
