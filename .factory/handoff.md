# Repair handoff — verification 6 findings

## Status

**Ready for static deployment.** This repair is based on verifier-report commit
`151ecc0d925a4be73dc8f28786f0f7e5c82b9faf` and preserves the existing Vite,
TypeScript, local-first PWA artifact and Static Web Apps configuration.

## Fixed release blockers

- **HEC-QA6-1:** Replaced regex XML extraction with a single-pass structural
  scanner. It maintains a bounded element stack (256 levels), enforces the
  500,000-record cap while scanning, and stops deeply nested malformed XML
  immediately rather than rescanning the remaining document. The verifier's
  exact 40,000 unclosed `<Record>` input now rejects in 0.112 s end-to-end in
  Node (the parser itself is below the unit-test 500 ms bound).
- **HEC-QA6-2:** XML parsing now validates one balanced `HealthData` root,
  matched closing tags, quoted/unique attributes, comments, CDATA, processing
  instructions, and entity references. Only direct `HealthData > Record`
  entries are imported. Record-shaped comments are ignored; incomplete XML is
  rejected before source-ready state can be rendered.
- **HEC-QA6-3:** CSV parsing now permits a closing quote only when immediately
  followed by a comma, row ending, or end of file. It rejects
  `"72"trailing-junk` and quotes inside unquoted fields instead of repairing
  them silently.
- Stabilized the previously observed `csv-conventions` claim race: its demo
  test now waits for `bounded.csv` to replace the already-ready demo sample
  before setting date controls. Five consecutive isolated runs passed.

## Regression coverage

- Unit tests cover the exact trailing-text quoted CSV, incomplete `HealthData`,
  comment-only `Record`, and 40,000-unclosed-`Record` verifier inputs.
- The `@claim:strict-parser` browser test uploads each malformed CSV/XML case
  through the real `/demo` intake, verifies the visible recovery errors, then
  verifies sample recovery.
- `.factory/claims.json` and README now truthfully say malformed quoted CSV and
  invalid or unrelated XML are rejected. All 16 declared claim commands pass
  independently.

## Verification evidence (2026-08-28 UTC)

| Check | Result |
| --- | --- |
| Clean install | `npm ci` — 143 packages, 0 vulnerabilities |
| Unit/contract | `npm run test:unit` — 28/28 passed |
| Full suite | `npm test` — 28/28 Vitest + 27/27 Playwright passed |
| Claims | All 16 `.factory/claims.json` commands passed separately |
| Lint/type/build | `npm run lint` and `npm run build` passed; `dist/` produced |
| Parser boundary reproduction | exact 40,000 unclosed records rejected in 0.112 s; malformed CSV, incomplete XML, and comment-only XML reject with specific errors |
| Browser and accessibility | Local `verify-url.sh` passed: HTTP 200, 531 ms load, title, `lang=en`, one `h1`, `main`, alt text, labeled buttons, no console/page errors; Playwright Axe checks pass in empty/configured/legal states |
| Responsive/keyboard/privacy/PWA | Full Playwright suite covers 1366px and 390px, skip link and keyboard download, same-origin/no-upload flow, offline demo reload, service-worker update, fallback, metadata, and cache policy |

The standalone `npx @axe-core/cli` was attempted but its Selenium driver could
not find a Chrome binary in this container. The repository's installed
Playwright Chromium and `@axe-core/playwright` integration ran successfully;
the full browser suite has the accessibility assertions above.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
```

Deploy the generated `dist/` as the existing static application using
`public/staticwebapp.config.json`; pushing `main` is the configured factory
delivery path. No server/API, billing, account, or identity endpoint applies
to this offline PWA.

## Known gaps / next steps

There are no known product gaps from verification 6. After the static host
publishes this commit, rerun the live Playwright suite with
`PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e`
to confirm deployment parity and live identity.
