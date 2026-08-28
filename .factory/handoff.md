# Review round 3 handoff

## Status

Review completed with verdict **FAIL**. One blocking finding is documented in
`.factory/review-3.md`: demo Reset and exit can race and overwrite the real
timestamp preference. No product code was changed.

## What was done

- Re-ran the cold first read at 390 × 844 and 1440 × 900.
- Audited all landing and README copy with word counts.
- Exercised the one-click demo, Reset, exit, storage namespaces, downloads,
  request log, and offline behavior.
- Read `.factory/claims.json` and ran all 19 listed commands separately from a
  fresh clone at `325629810d43ef4d36787a367d801521cc8406da`.
- Read every earlier review, polish report, and handoff; independently checked
  all 17 earlier findings in live behavior and source.
- Checked route metadata, the designed 404, deep links, browser Back/focus,
  every navigational link, shared chrome, accessibility, and visual identity.

## Verification

```sh
npm ci
npm run lint
npm test
npm run build
PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in npm run test:e2e
```

Results from the fresh clone:

- `npm ci`: passed with zero vulnerabilities.
- All 19 claim commands: passed separately.
- `npm run lint`: passed.
- `npm test`: passed, 31 unit/contract and 29 browser tests.
- `npm run build`: passed and emitted `dist/`; main JS was 9.27 kB gzip.
- Complete live suite: 29/29 passed.

The additional storage race is not covered by the current suite. The live
reproduction seeds a normal Exact preference, enters demo, starts Reset, delays
the demo IndexedDB deletion, then exits while the sample reload is in flight.
Two of three repetitions replaced the real record with the demo Day setting.

## Required next step

Keep the demo namespace immutable until navigation, cancel or await reset work
before exit, handle blocked IndexedDB deletion, and extend
`@claim:sample-demo` to prove a seeded real record remains byte-for-byte
unchanged. Then rerun the full verification set.
