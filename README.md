# Health Export Cleaner

Health Export Cleaner helps wearable users clean a smaller health export before
sharing it. <!-- claim:minimization-controls --> It opens supported CSV or Apple Health XML exports, then lets the
user:

- choose a date range and record types; <!-- claim:minimization-controls -->
- choose which non-sensitive fields to keep; <!-- claim:minimization-controls -->
- always remove common identifiers, device details, GPS, routes, and location; <!-- claim:identifier-removal -->
- reduce timestamps to a day or hour; <!-- claim:minimization-controls -->
- preview the result and the exact number of removed rows and fields; and <!-- claim:removal-receipt -->
- download one ZIP containing a cleaned CSV and a provenance/risk note. <!-- claim:clean-package -->

Health records stay in page memory and are not uploaded or retained. Only the
timestamp-precision preference is saved in IndexedDB. The app works offline
after its first visit. <!-- claim:local-processing --> <!-- claim:preference-portability --> <!-- claim:offline-reload -->

## Try the sample safely

Open `/demo` (or `/?demo=1`) to load sample wearable records immediately. Demo
preferences use a separate `demo:health-export-cleaner` IndexedDB database;
they never touch the normal cleaner preferences. The demo banner can reset the
sample or discard its preference before starting for real. See
[.factory/demo.md](.factory/demo.md) for the sample and reset details. <!-- claim:sample-demo -->

The cleaner needs no account or installation. <!-- claim:no-setup -->

## Supported sources and limits

- CSV with a header row. Common `type`, date, and timestamp column names
  (including `recorded_at`) are detected. When a date boundary is set, rows
  without a usable date are excluded rather than guessed. A CSV without a type
  column is treated as one record type. <!-- claim:csv-conventions -->
- Apple Health `export.xml`. Version 1 intentionally reads `<Record>` elements
  only; workouts, routes, clinical records, ActivitySummary, and nested
  metadata are omitted. <!-- claim:supported-sources --> <!-- claim:apple-record-scope -->
- Files are capped at 100 MB and 500,000 parsed records to prevent a malformed
  or very large export from exhausting the tab. <!-- claim:safety-limits -->

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
are emitted as standalone pages. `/demo` is the isolated sample route and an
unknown address receives the styled `404.html` response with HTTP 404 on Static
Web Apps.

## Privacy and security model

All parsing, filtering, ZIP generation, and download creation happen in the
browser. No third-party runtime scripts, fonts, analytics, or trackers are
included. <!-- claim:first-party-runtime --> Health records remain in page memory and disappear on refresh or tab
close. <!-- claim:local-processing --> See the in-product [privacy notice](https://health-export-cleaner.sociobot.in/privacy/)
for details.

The parser uses structural limits and rejects malformed quoted CSV input or
unrelated XML. These controls are resource-safety measures, not a guarantee
that a vendor-defined column is non-sensitive. <!-- claim:strict-parser -->

## License

Free to use under the MIT License. The product links to its public source code.
<!-- claim:free-source --> See [LICENSE](LICENSE).
