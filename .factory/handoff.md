# Polish round 2 handoff

## Status

Accepted repair. Every finding in `review-1.md` and `review-2.md` is closed;
there are no known gaps. The final product commits are
`d7c5ce58b5039e272708068693972838edc79278` and
`ca222626f51727bbc8b254e5f46c03933c9e9d7e`, both pushed to `main`.

## What changed

- Registered the Exact timestamp promise as `exact-timestamp` in
  `.factory/claims.json`, marked its UI location, and added a real fresh-demo
  download test. It asserts the source value `2026-08-20 08:12:41 +0000` is
  retained in the cleaned CSV.
- Advanced the PWA shell cache to `health-cleaner-v8`, PWA launch query to
  `pwa-v4`, and visible build identity to v1.0.4.
- Corrected the static Privacy, Terms, and 404 footers to the same v1.0.4 build
  identity as the landing page, preserving the shared route chrome.
- Updated the catalog sentence to a verb-first, 115-character description.

The full cumulative finding map and screenshots are in `.factory/polish-2.md`.

## Verify

```sh
npm ci
npm run lint
npm test
npm run build
```

Fresh clone evidence for final commit `ca222626f51727bbc8b254e5f46c03933c9e9d7e`:

- `npm ci`: passed, 0 vulnerabilities.
- All 19 `claims.json` commands ran separately and passed.
- `npm run lint`: passed.
- `npm test`: 31 unit/contract tests and 29 Playwright tests passed.
- `npm run build`: passed and emitted `dist/`; main JS is 9.27 kB gzip and CSS
  is 4.52 kB gzip.
- Accessibility: the installed Playwright Axe checks found zero serious or
  critical violations in empty/configured/legal states; keyboard, route focus,
  mobile, privacy/network, offline, and service-worker tests are part of the
  browser suite. The standalone Axe CLI was attempted but its ChromeDriver
  could not find a system Chrome binary.
- Local and cold-live `verify-url.sh` reports are under
  `.factory/evidence/polish-2-local/` and `.factory/evidence/polish-2-live/`.
  They show correct title/lang/h1/main/alt/labels and zero browser errors.
- Live Playwright: 29/29 passed at
  `https://health-export-cleaner.sociobot.in` after deployment.

## Deployment

`dist/` deployed through `/opt/fleet/lib/deploy-static.sh health-export-cleaner dist`.
Azure Static Web Apps deployment ID: `0eb9111b-efe9-4078-a69a-0bfac1933537`.
Cold checks confirmed `/`, `/demo`, `/?demo=1`, `/privacy/`, and `/terms/` at
HTTP 200, plus the styled unknown-route response at HTTP 404.
