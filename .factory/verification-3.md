# Independent verification 3 — FAIL

**Candidate:** `72ccbf9fb8450019b63aad4f40788ad25bb2b2f5` (`main`)

**Live URL:** <https://health-export-cleaner.sociobot.in>

**Verified:** 2026-08-28 UTC from a clean, initially unmodified checkout.

## Release decision

**FAIL — do not release this candidate.** The required claims contract is
missing, so no claim can be run from the demo entry point. The mandated
first-screen sample demo and isolated demo sandbox are also absent. These are
explicit release gates, regardless of the passing implementation tests below.

## Release-blocking defects

### HEC-QA3-1 — Critical — `.factory/claims.json` is missing

The candidate contains no `.factory/claims.json`; `test -f
.factory/claims.json` failed. Consequently there were no listed commands to
run before QA, no `@claim:<id>` tests (`rg '@claim' tests src README.md
.factory` returned none), and no testable mapping for live claims.

This directly violates the claims skill, which states that a missing claims
file is release-blocking. It also leaves material visitor claims unregistered,
including “Never uploads or retains health records”, “Online · works offline”,
“Opens CSV and Apple Health XML”, and README assertions about local processing
and offline use. Existing general E2E tests are useful regression coverage but
are not a substitute for the required one-test-per-claim manifest and tagged,
clean-demo execution.

### HEC-QA3-2 — High — the required first-screen one-click demo and sandbox do not exist

Cold-opening the live root at desktop and 390 px showed the headline **“Keep
the slice. Leave the trail.”** and informational copy only. It has no primary
action at all in the first screen. The first available sample action is below
the hero and is labelled **“Try a safe sample”**, not the mandated visible
**“Try it with sample data”** action with an explanation of the immediate
result.

The cold first read therefore does not plainly identify the intended audience
(wearable users) or what to click first. The metaphor is not a plain-words job
headline.

`/demo` and `/?demo=1` both return the normal root document (identical
SHA-256: `628e21b39c49a9a2aa33321a896a8e78256a925a963dacbab4e89f13a77bf3f9`).
Neither contains “Demo”, “Reset demo”, or “Start for real”; each exposes only
“Try a safe sample”. In a fresh context at `/?demo=1`, loading the sample and
selecting Hour wrote `{"timePrecision":"hour"}` to the normal
`health-export-cleaner` IndexedDB database. There is no `demo:` storage
namespace or reset control. `.factory/demo.md` is also missing.

This violates the demo-sandbox requirements: the demo is not a distinct,
documented sandbox and its preferences share normal-product storage.

### HEC-QA3-3 — Medium — unknown paths are not a real 404 page

`GET /missing-route` returns `200 text/html` and the root app document. The
site-structure contract requires a styled real 404 route with a way back.

## First-read record

On a cold live visit, this looks like a local health-export cleaner: it says a
visitor can choose dates, record types, and fields before sharing a file. The
visible headline is metaphorical (“Keep the slice. Leave the trail.”), not the
job in plain words. It does not say it is for wearable users, and there is no
first-screen action to click. The first actionable sample control appears in
the later “Place an export on the bench” section as “Try a safe sample”. The
desktop and 390 px screenshots are retained at
`/tmp/hec-verify-glE3k6/screenshot-desktop.png` and
`/tmp/hec-verify-glE3k6/screenshot-mobile.png` in this verification worker.

## Clean-install quality gates

| Check | Result | Evidence |
| --- | --- | --- |
| Clean checkout | PASS | `HEAD` was the candidate and `git status --porcelain` was empty before QA. |
| `npm ci` | PASS | 143 packages installed; audit reported 0 vulnerabilities. |
| `npm test` | PASS | 20/20 Vitest tests and 11/11 local Playwright tests passed. |
| `npm run lint` | PASS | ESLint completed without errors. |
| `npm run build` | PASS | `tsc --noEmit && vite build` completed and emitted `dist/`. |
| Live E2E | PASS | `PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`: 11/11 passed. |
| Claim tests | **BLOCKED / FAIL** | Required claims file and tagged claim tests do not exist. |

The normal app tests cover representative CSV cleaning, direct-identifier
removal in the actual ZIP, bounded/undated dates, malformed inputs and
recovery, keyboard operation, storage/network privacy, offline reload,
service-worker update, Axe, and 390 px rendering. Apple Health XML parsing and
malformed/oversize parser boundaries are covered by the unit suite.

## Independent live checks that passed

- Deployed identity: local production output has 21 files, one of which is
  deployment-only `staticwebapp.config.json`. All **20 served application
  files** matched the live URLs byte-for-byte; the live root references the
  candidate's `main-BBQwnHil.js` and `main-Cl2DGfu1.css`.
- `verify-url.sh https://health-export-cleaner.sociobot.in <evidence-dir>`:
  HTTPS 200; title, `lang="en"`, one `<h1>`, `<main>`, complete image alt text,
  and no console/page errors. Its measured navigation was 595 ms.
- Default Axe via the product's Playwright integration found 0 serious or
  critical violations on empty/configured root plus Privacy and Terms. The
  standalone `@axe-core/cli` was attempted twice but could not create a
  compatible Selenium Chrome session with this worker's Playwright Chromium;
  this is a tool-environment limitation, not an application error.
- The keyboard E2E path passed: visible 3 px focus on the skip link, Enter to
  main, native file/sample controls, form controls, and download without a
  trap. The independent 390×844 test passed with no horizontal overflow.
- Reduced-motion handling, offline reload after first visit, and the
  service-worker update toast/activation passed in the local suite and the live
  E2E matrix.
- Lighthouse 12.8.2 on live (mobile profile): Performance **100**,
  Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP
  1.1 s, TBT 60 ms, CLS 0. Main JS is 20.62 kB / 7.95 kB gzip and main CSS is
  15.00 kB / 4.28 kB gzip, both within budget; there are no runtime fonts.

## Privacy, security, and deployment evidence

- The fresh-browser live demo experiment observed requests only to
  `https://health-export-cleaner.sociobot.in`; console/page errors were empty.
  Source audit found no runtime network client, analytics, third-party scripts,
  authentication, unlock call, payment integration, or remote fonts. The
  configured browser test confirms health input causes no subsequent request
  and does not survive reload.
- Live headers include HSTS, enforcing same-origin CSP with
  `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, restrictive
  Permissions-Policy, and Referrer-Policy. Hashed `/assets/*` are
  `max-age=31536000, immutable`; `/sw.js` is no-store; the manifest is
  `application/manifest+json` with five-minute revalidation.
- The manifest has standalone display, a versioned start URL, 192/512 and
  maskable icons. The worker precaches shell assets and the live offline test
  passed.
- There is no server-side product API or sign-in. Rate-limit/429 and Entra
  tenant checks are therefore not applicable; `POST /` returns 405.

## Required remediation and re-verification

1. Add `.factory/claims.json` and one clean-demo, observable
   `@claim:<id>` test for each user-facing claim. Run every listed command from
   a fresh checkout before submitting.
2. Implement and document `/demo` (or `?demo=1`) as a true isolated sample
   namespace. Put a visible “Try it with sample data” control and immediate
   outcome explanation on the first screen, plus persistent demo, reset, and
   start-for-real controls. Ensure demo preferences/storage cannot touch real
   storage.
3. Replace the metaphorical first-screen headline/copy with the plain job,
   name wearable users, and make the real first action unambiguous.
4. Add a real styled 404 response/page and include all required routes in the
   sitemap.
5. Re-run the complete clean-install, claims, live identity, accessibility,
   PWA, privacy, and response-policy matrix.
