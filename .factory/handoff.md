# Review 1 handoff

## Status

Adversarial first-read review 1 is complete. Verdict: **FAIL** with 16 minor
findings and no blocking findings. See `.factory/review-1.md`.

Product code was not changed.

## What was reviewed

- Cold live landing page at 390 × 844 and 1440 × 900
- One-click demo, sample state, Reset, Start for real, and storage separation
- Landing/error copy and every README sentence
- Every `.factory/claims.json` command and the full local/deployed suites
- Offline reload, network interception, routes, metadata, links, focus, shared
  chrome, visual identity, accessibility, and repository history
- Missed AI/import/export/sync leverage

## Verification

```sh
npm ci
npm test
npm run lint
npm run build
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
```

Observed results:

- all 16 listed claim commands pass individually
- `npm test`: 28 unit tests and 27 end-to-end tests pass
- deployed suite: 27/27 pass
- lint/build pass and `dist/` is emitted
- live `verify-url.sh` passes with zero console errors
- live axe CLI reports 0 violations
- all crawled internal routes/assets and the GitHub link return 200
- production JS is 9.14 kB gzip; CSS is 4.43 kB gzip

## Work left

Resolve F-1-1 through F-1-16. Open work covers claims registration/copy, route
focus, shared header/footer structure, external-link labeling, terminology,
jargon, one demo action label, and two parser errors without a next step.

After repairs, repeat the complete review rather than checking only the diff.
