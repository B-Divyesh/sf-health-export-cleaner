# Health Export Cleaner — independent verification handoff

## Status: FAIL — do not release candidate be3bf764

Independent verification was completed on 2026-08-28 UTC for commit
`be3bf76419358f0053595618a7770e3ba83b5131` and
<https://health-export-cleaner.sociobot.in>. The live deployment matches all 22
served files from the candidate production build byte-for-byte, so the earlier
deployment-only uncertainty is resolved.

No product code was changed. Full evidence and defects are in
`.factory/verification-4.md`.

## Release blockers

1. At 1366×768 the cold first screen places **Try it with sample data** entirely
   below the viewport (top y=811.5), so it does not show what to click first.
2. A source named `Jane Doe personal health.csv` produces a ZIP named
   `Jane-Doe-personal-health-cleaned-package.zip` and repeats the original name
   in the provenance note. Identifier fields are removed, but a filename-based
   identifier survives in the shareable artifact.
3. Material quantitative/parser claims, including the 100 MB / 500,000-record
   safety limits and exact removal counts, are not listed in
   `.factory/claims.json`; the claims contract says an unlisted claim fails the
   review.
4. `/offline.html` violates the deployed CSP because it uses inline CSS, and
   uncached offline navigation returns cached `/` instead of the fallback.

Required metadata/footer and copy-audit items are also incomplete; see the
Medium/Low findings in the full report.

## What passed

- All six claim commands passed separately before other QA.
- Clean `npm ci`; 20 unit tests; 14 local Playwright tests; lint; TypeScript;
  exact production build; and 14 live Playwright tests all passed.
- CSV and Apple Health XML cleaning worked end to end, including ZIP contents,
  provenance, date/type/field filtering, and identifier/location-field removal.
- Empty, malformed, unrelated, over-100 MB, and over-500,000-record inputs were
  rejected with recovery; exactly 500,000 records were accepted.
- Privacy probing observed only same-origin static requests and no health-data
  persistence. Root/demo offline reload and service-worker update passed.
- Axe found 0 WCAG A/AA violations on home/privacy/terms. Keyboard, focus,
  390 px mobile, 200% text size, and reduced-motion checks passed.
- Lighthouse mobile: Performance 98, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 150 ms, CLS 0.
- Main JS is 20.80 kB (7.92 kB gzip), main CSS is 15.77 kB (4.41 kB gzip),
  and the mobile hero is 47.27 kB.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
```

Run each exact `.factory/claims.json` command separately before re-verification.
Then repeat the 1366×768 cold first-read check, filename disclosure test,
offline unknown-route/CSP check, file hash comparison, Axe, and Lighthouse.
