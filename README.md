# Health Export Cleaner

Health Export Cleaner is a free, browser-only utility for wearable users who
need to share a bounded slice of their own health data. It opens supported CSV
or Apple Health XML exports, then lets the user:

- choose a date range and record types;
- choose which non-sensitive fields to keep;
- always remove common identifiers, device details, GPS, routes, and location;
- reduce timestamps to a day or hour;
- preview the result and the exact number of removed rows and fields; and
- download one ZIP containing a cleaned CSV and a provenance/risk note.

The source file is never uploaded or persisted. Only the timestamp-precision
preference is saved in IndexedDB. The app can be installed and used offline
after its first visit.

## Supported sources and limits

- CSV with a header row. Common `type`, date, and timestamp column names are
  detected. A CSV without a type column is treated as one record type.
- Apple Health `export.xml`. Version 1 intentionally reads `<Record>` elements
  only; workouts, routes, clinical records, ActivitySummary, and nested
  metadata are omitted.
- Files are capped at 100 MB and 500,000 parsed records to prevent a malformed
  or very large export from exhausting the tab.

Minimization is not anonymization. Free-text values, rare measurements, dates,
and combinations of otherwise ordinary data may identify a person. Users
should inspect the output before sharing it.

## Develop

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

The local development server is printed by Vite (normally
`http://localhost:5173`). There are no runtime API keys or services.

## Test and build

Playwright 1.58.2 is pinned. In an environment without its Chromium binary,
run `npx playwright install chromium` once.

```sh
npm test          # unit + Chromium end-to-end, axe, mobile, and offline checks
npm run lint      # ESLint for application, test, and build TypeScript
npm run build     # reproducible production build in ./dist
npm run preview   # serve ./dist at http://127.0.0.1:4173
```

To run the same browser matrix against the deployed app, set
`PLAYWRIGHT_BASE_URL=https://health-export-cleaner.sociobot.in` before
`npm run test:e2e`.

`dist/index.html` is the static deployment entry. `/privacy/` and `/terms/`
are emitted as standalone pages.

## Privacy and security model

All parsing, filtering, ZIP generation, and download creation happen in the
browser. No third-party runtime scripts, fonts, analytics, or trackers are
included. Health records remain in page memory and disappear on refresh or tab
close. See the in-product [privacy notice](https://health-export-cleaner.sociobot.in/privacy/)
for details.

The parser uses structural limits and rejects malformed quoted CSV input or
unrelated XML. These controls are resource-safety measures, not a guarantee
that a vendor-defined column is non-sensitive.

## License

MIT. See [LICENSE](LICENSE).
