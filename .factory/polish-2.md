# Polish round 2 — zero-finding closure

Reviewed base: `0fcbfbca2222261405c3e005eb97e1b947ae6c10`  
Repair commits: `d7c5ce58b5039e272708068693972838edc79278`,
`ca222626f51727bbc8b254e5f46c03933c9e9d7e`  
Deployed: `0eb9111b-efe9-4078-a69a-0bfac1933537`

All review reports were read: `review-1.md`, `review-2.md`, and
`polish-1.md`. There are no open findings.

## Finding map

| Finding | Change made or retained repair | Evidence |
| --- | --- | --- |
| F-1-1 | Day helper remains “day only”; the unsupported safety comparison is absent. | `visitor claims contract > keeps every adversarial review wording repair literal`; live `/demo`. |
| F-1-2 | Update notice remains “An update is ready” and is registered. | `@claim:update-ready`; live browser suite. |
| F-1-3 | The untestable README services/keys sentence remains removed. | Claim-contract test; live `/privacy/`. |
| F-1-4 | Styled 404 remains registered as `designed-404`. | `@claim:designed-404`; cold live `/not-a-real-route` → HTTP 404. |
| F-1-5 | Legal/404 route entries retain heading focus and polite announcements. | `uses shared route chrome and restores heading focus…`; live browser suite. |
| F-1-6 | All routes retain the shared wordmark, Demo/Privacy/Terms navigation, footer, maker, and matching v1.0.4 build ID. | `declares route metadata…`; live `/privacy/`, `/terms/`, and 404. |
| F-1-7 | External source link remains labelled as an external GitHub site. | `@claim:free-source`; live `/`. |
| F-1-8 | Result terminology remains “cleaned copy”; ZIP is only the download container. | `@claim:clean-package`, `@claim:minimization-controls`; live `/demo`. |
| F-1-9 | “Date range” remains the sole user-facing filter term. | Claim-contract wording test; live `/demo`. |
| F-1-10 | File companion remains “file details and risk note.” | `@claim:clean-package`; live `/demo`. |
| F-1-11 | README parser wording remains concrete and recovery-oriented. | `@claim:strict-parser`; README. |
| F-1-12 | XML declaration error retains its plain recovery action. | `@claim:strict-parser`; live `/demo`. |
| F-1-13 | Demo exit remains “Clean my own file” and deletes demo preferences. | `@claim:sample-demo`; live `/demo`. |
| F-1-14 | Header-only CSV error retains a next action. | `@claim:strict-parser`; live `/demo`. |
| F-1-15 | Missing Apple Health section error retains a next action. | `@claim:strict-parser`; live `/demo`. |
| F-1-16 | README continues to say “browser checks.” | Claim-contract wording test; README. |
| F-2-1 | Added the `exact-timestamp` claim, marked the Exact control, and added a fresh-demo ZIP test asserting `2026-08-20 08:12:41 +0000` is preserved. | `@claim:exact-timestamp`; [local Exact mobile](evidence/polish-2-local/exact-timestamp-mobile.png); [live Exact mobile](evidence/polish-2-live/exact-timestamp-mobile.png); live `/demo`. |

## Evidence

- A fresh GitHub clone at `ca222626f51727bbc8b254e5f46c03933c9e9d7e` ran all 19
  commands listed in `.factory/claims.json` separately, then `npm run lint`,
  `npm test` (31 unit/contract and 29 browser tests), and `npm run build`.
  All passed. The clean browser result is `test-results/.last-run.json` with
  `status: passed`.
- The installed Playwright Axe integration found no serious or critical issue
  in empty, configured, Privacy, or Terms states. The standalone Axe CLI was
  also attempted, but its downloaded ChromeDriver could not find a system
  Chrome binary; the pinned Playwright integration is the accessibility-suite
  verifier used here.
- Local basic verification: [verify report](evidence/polish-2-local/verify.json),
  [desktop](evidence/polish-2-local/screenshot-desktop.png), and
  [390px mobile](evidence/polish-2-local/screenshot-mobile.png). It reported
  a title, `lang=en`, one h1, a main landmark, image alt attributes, labelled
  buttons, and no console/page errors.
- Cold live verification: [verify report](evidence/polish-2-live/verify.json),
  [desktop](evidence/polish-2-live/screenshot-desktop.png), and
  [390px mobile](evidence/polish-2-live/screenshot-mobile.png). It reported
  the same checks with zero errors. The full live browser suite passed 29/29.

