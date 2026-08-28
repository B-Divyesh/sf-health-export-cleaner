import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

function readStoredZip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = new Map<string, string>();
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    expect(view.getUint16(offset + 8, true)).toBe(0);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const contentOffset = offset + 30 + nameLength + extraLength;
    const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength));
    entries.set(name, new TextDecoder().decode(bytes.slice(contentOffset, contentOffset + size)));
    offset = contentOffset + size;
  }
  return entries;
}

async function downloadBytes(download: import('@playwright/test').Download): Promise<Uint8Array> {
  const stream = await download.createReadStream();
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(new Uint8Array(chunk));
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

test('@claim:sample-demo loads sample data in a separate disposable preference namespace', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#source-name')).toHaveText('sample-health-export.csv');
  await page.getByRole('radio', { name: /Hour/ }).check();
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name))).toContain('demo:health-export-cleaner');
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).not.toContain('health-export-cleaner');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('radio', { name: /Day/ })).toBeChecked();
  await expect(page.getByText('2026-08-28 · day only')).toBeVisible();
  await expect(page.locator('#source-name')).toHaveText('sample-health-export.csv');
  await expect(page.getByRole('link', { name: 'Clean my own file' })).toBeVisible();

  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#source-name')).toHaveText('sample-health-export.csv');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#source-name')).toHaveText('sample-health-export.csv');
  await page.getByRole('link', { name: 'Clean my own file' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#demo-banner')).toBeHidden();
  await expect(page.locator('#configure-panel')).toBeHidden();
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name))).not.toContain('demo:health-export-cleaner');
});

test('@claim:supported-sources opens CSV and Apple Health XML from the demo entry point', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#source-format')).toHaveText('CSV');
  await page.locator('#file-input').setInputFiles({
    name: 'export.xml', mimeType: 'application/xml',
    buffer: Buffer.from('<?xml version="1.0"?><HealthData><Record type="HKQuantityTypeIdentifierHeartRate" startDate="2026-08-28 10:00:00 +0000" endDate="2026-08-28 10:01:00 +0000" value="72" unit="count/min"/></HealthData>')
  });
  await expect(page.locator('#source-format')).toHaveText('XML');
  await expect(page.locator('#source-count')).toHaveText('1');
});

test('@claim:no-setup cleans and exports from a fresh browser without an account or install step', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Source ready')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  await expect(page.getByText(/sign in|log in|create account/i)).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('health-export-cleaned-copy.zip');
});

test('@claim:free-source exposes the free utility and its MIT-licensed source', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('footer')).toContainText('Free to use under the MIT License.');
  await expect(page.getByRole('link', { name: 'Source code on GitHub (external site)' })).toHaveAttribute(
    'href',
    'https://github.com/B-Divyesh/sf-health-export-cleaner'
  );
  await expect(page.locator('[href*="checkout"], [href*="billing"], [href*="subscribe"]')).toHaveCount(0);
  await expect(page.getByText(/paywall|payment required|subscription required/i)).toHaveCount(0);
  expect(await readFile('LICENSE', 'utf8')).toMatch(/Permission is hereby granted, free of charge/);
});

test('@claim:first-party-runtime makes no third-party runtime requests during a complete demo flow', async ({ page }) => {
  const requests: Array<{ url: string; type: string }> = [];
  page.on('request', (request) => requests.push({ url: request.url(), type: request.resourceType() }));
  await page.goto('/demo');
  await expect(page.getByText('Source ready')).toBeVisible();
  await page.getByRole('radio', { name: /Hour/ }).check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  await downloadPromise;

  const pageOrigin = new URL(page.url()).origin;
  expect([...new Set(requests.map(({ url }) => new URL(url).origin))]).toEqual([pageOrigin]);
  expect(requests.filter(({ type }) => ['xhr', 'fetch', 'websocket'].includes(type))).toEqual([]);
  const runtimeUrls = await page.locator('script[src], link[rel="stylesheet"][href], link[rel="preload"][href]').evaluateAll(
    (elements) => elements.map((element) => (element as HTMLScriptElement | HTMLLinkElement).src || (element as HTMLLinkElement).href)
  );
  expect(runtimeUrls.every((url) => new URL(url).origin === pageOrigin)).toBe(true);
});

test('@claim:clean-package cleans a sample end to end and exposes both archive entries before download', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Source ready')).toBeVisible();
  await expect(page.getByText('3 fields removed')).toBeVisible();
  await expect(page.getByText('3 rows kept')).toBeVisible();

  const sourceField = page.locator('.field-list label').filter({ hasText: 'sourceName' });
  await expect(sourceField.getByText('Always removed')).toBeVisible();
  await expect(sourceField.locator('input')).toBeDisabled();

  await page.locator('#end-date').fill('2026-08-21');
  await expect(page.getByText('2 rows kept')).toBeVisible();
  await expect(page.getByText(/1 row left out/)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/cleaned-copy\.zip$/);
  const entries = readStoredZip(await downloadBytes(download));
  expect(entries.get('health-export-cleaned.csv')).toContain('HeartRate');
  expect(entries.get('health-export-cleaned-file-details-and-risk.txt')).toContain('HEALTH EXPORT CLEANER — FILE DETAILS AND RISK NOTE');
});

test('@claim:identifier-removal locks verifier identifiers out and excludes their values from the downloaded CSV', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#file-input').setInputFiles({
    name: 'verifier.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([
      'type,date,value,patientId,participantID,recordId,patientName,emailAddress,gpsCoordinates,deviceId,route,longitude',
      'HeartRate,2026-08-28,72,P-123,S-456,R-789,Jane Doe,jane@example.test,"51.5,-0.1",WATCH-9,SECRET-ROUTE,-0.1'
    ].join('\n'))
  });
  await expect(page.getByText('Source ready')).toBeVisible();
  for (const field of ['patientId', 'participantID', 'recordId', 'patientName', 'emailAddress', 'gpsCoordinates', 'deviceId', 'route', 'longitude']) {
    const row = page.locator('.field-list label').filter({ hasText: field });
    await expect(row.getByText('Always removed')).toBeVisible();
    await expect(row.locator('input')).toBeDisabled();
  }
  await expect(page.locator('#removed-fields-detail')).toHaveText('patientId, participantID, recordId, patientName, emailAddress, gpsCoordinates, deviceId, route, longitude');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const entries = readStoredZip(await downloadBytes(await downloadPromise));
  const csv = entries.get('health-export-cleaned.csv') ?? '';
  expect(csv).toBe('type,date,value\r\nHeartRate,2026-08-28,72\r\n');
  expect(csv).not.toMatch(/P-123|S-456|R-789|Jane Doe|jane@example\.test|51\.5,-0\.1|WATCH-9|SECRET-ROUTE/);
});

test('uses neutral archive names and omits the personal source filename from shared artifacts', async ({ page }) => {
  await page.goto('/demo');
  const filename = 'Jane Doe personal health.csv';
  await page.locator('#file-input').setInputFiles({
    name: filename, mimeType: 'text/csv',
    buffer: Buffer.from('type,date,value,patientId,latitude\nHeartRate,2026-08-28,72,Jane-123,51.5')
  });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('health-export-cleaned-copy.zip');
  const entries = readStoredZip(await downloadBytes(download));
  expect([...entries.keys()]).toEqual(['health-export-cleaned.csv', 'health-export-cleaned-file-details-and-risk.txt']);
  expect(entries.get('health-export-cleaned-file-details-and-risk.txt')).toContain('Source filename: omitted');
  expect(JSON.stringify([...entries.entries()])).not.toContain(filename);
});

test('@claim:removal-receipt previews exact kept, omitted, and removed-field counts', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#end-date').fill('2026-08-21');
  await expect(page.locator('#kept-summary')).toHaveText('2 rows kept');
  await expect(page.locator('#removed-summary')).toHaveText('1 row left out');
  await expect(page.locator('#removed-detail')).toHaveText('1 outside range · 0 without usable date · 0 by type');
  await expect(page.locator('#fields-summary')).toHaveText('3 fields removed');
  await expect(page.locator('#removed-fields-detail')).toHaveText('sourceName, device, latitude');
});

test('@claim:strict-parser rejects malformed CSV and invalid or unrelated XML with recovery guidance', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#file-input').setInputFiles({ name: 'headers-only.csv', mimeType: 'text/csv', buffer: Buffer.from('type,date,value') });
  await expect(page.locator('#error-box')).toHaveText('The CSV has headers but no data rows. Export a CSV with at least one health record, then try again.');
  await page.locator('#file-input').setInputFiles({ name: 'broken.csv', mimeType: 'text/csv', buffer: Buffer.from('type,value\nHeartRate,"72') });
  await expect(page.locator('#error-box')).toContainText('unclosed quoted field');
  await page.locator('#file-input').setInputFiles({
    name: 'closing-quote-junk.csv', mimeType: 'text/csv',
    buffer: Buffer.from('type,date,value\nHeartRate,2026-08-28,"72"trailing-junk')
  });
  await expect(page.locator('#error-box')).toContainText('text after a closing quote');
  await page.locator('#file-input').setInputFiles({
    name: 'incomplete.xml', mimeType: 'application/xml',
    buffer: Buffer.from('<HealthData><Record type="HKQuantityTypeIdentifierHeartRate" value="72"/>')
  });
  await expect(page.locator('#error-box')).toContainText('malformed');
  await page.locator('#file-input').setInputFiles({
    name: 'comment-only.xml', mimeType: 'application/xml',
    buffer: Buffer.from('<HealthData><!-- <Record type="COMMENT-ONLY-SECRET" value="72"/> --></HealthData>')
  });
  await expect(page.locator('#error-box')).toContainText('No Apple Health Record elements');
  await page.locator('#file-input').setInputFiles({ name: 'declaration.xml', mimeType: 'application/xml', buffer: Buffer.from('<!DOCTYPE HealthData><HealthData><Record type="x"/></HealthData>') });
  await expect(page.locator('#error-box')).toHaveText('This XML contains a declaration the cleaner cannot read. Export a fresh file from Apple Health and try again.');
  await page.locator('#file-input').setInputFiles({ name: 'unrelated.xml', mimeType: 'application/xml', buffer: Buffer.from('<records><Record type="x"/></records>') });
  await expect(page.locator('#error-box')).toHaveText('This file is missing the Apple Health data section. Export it again from Apple Health, then try the new file.');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.locator('#source-name')).toHaveText('sample-health-export.csv');
});

test('@claim:safety-limits rejects 100 MB plus one byte and record 500,001 from the demo intake', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#file-input')!;
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array((100 * 1024 * 1024) + 1)], 'too-large.csv', { type: 'text/csv' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#error-box')).toContainText('100 MB safety limit');
  await page.evaluate(() => {
    const rows = ['type,date'];
    for (let index = 0; index <= 500_000; index += 1) rows.push(`HeartRate,2026-08-${String((index % 28) + 1).padStart(2, '0')}`);
    const input = document.querySelector<HTMLInputElement>('#file-input')!;
    const transfer = new DataTransfer();
    transfer.items.add(new File([rows.join('\n')], 'too-many-records.csv', { type: 'text/csv' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#error-box')).toContainText('more than 500,000 records');
});

test('locks ordinary government, medical-record, and phone identifiers out of the downloaded CSV', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({
    name: 'direct-identifiers.csv', mimeType: 'text/csv',
    buffer: Buffer.from([
      'type,date,value,ssn,mrn,medicalRecordNumber,phoneNumber,fullName',
      'HeartRate,2026-08-28,72,111-22-3333,MRN-42,MED-7,+1-202-555-0100,Jane Doe'
    ].join('\n'))
  });
  await expect(page.getByText('Source ready')).toBeVisible();
  for (const field of ['ssn', 'mrn', 'medicalRecordNumber', 'phoneNumber', 'fullName']) {
    const row = page.locator('.field-list label').filter({ hasText: field });
    await expect(row.getByText('Always removed')).toBeVisible();
    await expect(row.locator('input')).toBeDisabled();
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const entries = readStoredZip(await downloadBytes(await downloadPromise));
  const csv = entries.get('health-export-cleaned.csv') ?? '';
  expect(csv).toBe('type,date,value\r\nHeartRate,2026-08-28,72\r\n');
  expect(csv).not.toMatch(/111-22-3333|MRN-42|MED-7|\+1-202-555-0100|Jane Doe/);
});

test('@claim:csv-conventions recognizes recorded_at, fails closed on missing dates, and groups a CSV without type', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#file-input').setInputFiles({
    name: 'bounded.csv', mimeType: 'text/csv',
    buffer: Buffer.from([
      'type,date,value,notes',
      'HeartRate,2026-08-20,72,inside',
      'HeartRate,,999,UNDATED-ROW',
      'HeartRate,2026-08-22,65,outside'
    ].join('\n'))
  });
  // /demo starts with a ready sample, so wait for this intake to replace it
  // before setting boundaries. This keeps the claim test tied to its fixture.
  await expect(page.locator('#source-name')).toHaveText('bounded.csv');
  await page.locator('#start-date').fill('2026-08-20');
  await page.locator('#end-date').fill('2026-08-20');
  await expect(page.locator('#kept-summary')).toHaveText('1 row kept');
  await expect(page.locator('#removed-detail')).toHaveText('1 outside range · 1 without usable date · 0 by type');
  const boundedDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const boundedEntries = readStoredZip(await downloadBytes(await boundedDownload));
  const boundedCsv = boundedEntries.get('health-export-cleaned.csv') ?? '';
  expect(boundedCsv).toBe('type,date,value,notes\r\nHeartRate,2026-08-20,72,inside\r\n');
  expect(boundedCsv).not.toMatch(/UNDATED-ROW|outside/);
  expect(boundedEntries.get('health-export-cleaned-file-details-and-risk.txt')).toContain('Rows without usable date under active date range: 1');

  await page.locator('#file-input').setInputFiles({
    name: 'recorded-at.csv', mimeType: 'text/csv', buffer: Buffer.from('recorded_at,value\n2026-08-28T12:00:00Z,8')
  });
  await expect(page.locator('#source-warnings')).toContainText('all rows are grouped as “CSV record”');
  await expect(page.getByRole('checkbox', { name: /CSV record/ })).toBeChecked();
  await expect(page.locator('#source-span')).toHaveText('2026-08-28 — 2026-08-28');
  await page.locator('#start-date').fill('2026-08-29');
  await page.locator('#end-date').fill('2026-08-30');
  await expect(page.locator('#kept-summary')).toHaveText('0 rows kept');
  await expect(page.locator('#removed-detail')).toHaveText('1 outside range · 0 without usable date · 0 by type');
  await expect(page.getByRole('button', { name: /Download cleaned copy/ })).toBeDisabled();
});

test('@claim:minimization-controls applies dates, types, fields, and timestamp precision to the clean CSV', async ({ page }) => {
  await page.goto('/demo');
  const notes = page.locator('.field-list label').filter({ hasText: 'notes' });
  await notes.locator('input').uncheck();
  await expect(notes.getByText('Removed by you')).toBeVisible();
  await expect(page.locator('#removed-fields-detail')).toContainText('notes');

  const startDate = page.locator('.field-list label').filter({ hasText: 'startDate' });
  await expect(startDate.getByText('Kept · reduced to day')).toBeVisible();
  await page.getByRole('radio', { name: /Hour/ }).check();
  await expect(startDate.getByText('Kept · reduced to hour')).toBeVisible();
  await page.getByRole('checkbox', { name: /StepCount/ }).uncheck();
  await page.locator('#end-date').fill('2026-08-20');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const entries = readStoredZip(await downloadBytes(await downloadPromise));
  const csv = entries.get('health-export-cleaned.csv') ?? '';
  expect(csv).toContain('2026-08-20 08:00');
  expect(csv).not.toMatch(/StepCount|notes|lunch walk/);

  const available = page.locator('input[name="field"]:not(:disabled)');
  for (let index = 0; index < await available.count(); index += 1) await available.nth(index).uncheck();
  await expect(page.locator('#no-output')).toHaveText('No fields are selected. Select at least one available field to create a cleaned copy.');
  await expect(page.getByRole('button', { name: /Download cleaned copy/ })).toBeDisabled();
});

test('@claim:apple-record-scope imports Record entries and omits unsupported Apple Health sections', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#file-input').setInputFiles({
    name: 'export.xml',
    mimeType: 'application/xml',
    buffer: Buffer.from([
      '<?xml version="1.0"?><HealthData>',
      '<Record type="HKQuantityTypeIdentifierHeartRate" startDate="2026-08-28 10:00:00 +0000" value="72"><MetadataEntry key="secret" value="NESTED-METADATA"/></Record>',
      '<Workout workoutActivityType="WORKOUT-SECRET"/>',
      '<WorkoutRoute sourceName="ROUTE-SECRET"/>',
      '<ClinicalRecord type="CLINICAL-SECRET"/>',
      '<ActivitySummary activeEnergyBurned="SUMMARY-SECRET"/>',
      '</HealthData>'
    ].join(''))
  });
  await expect(page.locator('#source-count')).toHaveText('1');
  await expect(page.locator('#source-warnings')).toContainText('Workout elements are not included');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download cleaned copy/ }).click();
  const entries = readStoredZip(await downloadBytes(await downloadPromise));
  const exported = JSON.stringify([...entries.entries()]);
  expect(exported).toContain('HeartRate');
  expect(exported).not.toMatch(/NESTED-METADATA|WORKOUT-SECRET|ROUTE-SECRET|CLINICAL-SECRET|SUMMARY-SECRET/);
});

test('@claim:preference-portability exports and imports only timestamp precision', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('radio', { name: /Hour/ }).check();
  await page.getByText('Move cleaner preferences').click();
  const exportPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export preferences' }).click();
  const exported = JSON.parse(new TextDecoder().decode(await downloadBytes(await exportPromise))) as Record<string, unknown>;
  expect(exported).toEqual({ version: 1, timePrecision: 'hour' });
  expect(JSON.stringify(exported)).not.toMatch(/HeartRate|sample-health-export|latitude|records/i);

  await page.locator('#import-settings').setInputFiles({
    name: 'preferences.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"timePrecision":"day"}')
  });
  await expect(page.getByRole('radio', { name: /Day/ })).toBeChecked();
});

test('has no serious accessibility violations in the empty and configured states', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  results = await new AxeBuilder({ page }).withRules(['label-content-name-mismatch']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Source ready')).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});

test('supports a keyboard-only path through cleaning and download', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to cleaner' })).toBeFocused();
  expect(await page.getByRole('link', { name: 'Skip to cleaner' }).evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('3px');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#file-input')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Try it with sample data' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Source ready')).toBeVisible();

  let reachedDownload = false;
  for (let index = 0; index < 60; index += 1) {
    await page.keyboard.press('Tab');
    reachedDownload = await page.evaluate(() => document.activeElement?.id === 'download-button');
    if (reachedDownload) break;
  }
  expect(reachedDownload).toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  await expect(downloadPromise).resolves.toBeTruthy();
});

test('@claim:local-processing does not send or persist uploaded health data', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('#file-input').setInputFiles({
    name: 'private-secret.csv', mimeType: 'text/csv',
    buffer: Buffer.from('type,date,value,patientId\nHeartRate,2026-08-28,SECRET-HEALTH,SECRET-ID')
  });
  await expect(page.getByText('Source ready')).toBeVisible();
  await page.waitForTimeout(100);
  expect(requests).toEqual([]);
  const storageText = await page.evaluate(async () => {
    const cacheKeys = await caches.keys();
    const cacheUrls = (await Promise.all(cacheKeys.map(async (key) => (await caches.open(key)).keys()))).flat().map((request) => request.url);
    const databases = 'databases' in indexedDB ? await indexedDB.databases() : [];
    const preferenceValue = await new Promise<unknown>((resolve, reject) => {
      const open = indexedDB.open('demo:health-export-cleaner');
      open.onsuccess = () => {
        const get = open.result.transaction('preferences').objectStore('preferences').get('cleaner');
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      };
      open.onerror = () => reject(open.error);
    });
    return JSON.stringify({ cacheUrls, databases, preferenceValue });
  });
  expect(JSON.parse(storageText).preferenceValue).toEqual({ timePrecision: 'day' });
  expect(storageText).not.toMatch(/SECRET-HEALTH|SECRET-ID|private-secret/);
  await page.reload();
  await expect(page.locator('#source-name')).toHaveText('sample-health-export.csv');
  await expect(page.locator('#configure-panel')).not.toContainText('SECRET-HEALTH');
});

test('@claim:offline-reload remains usable offline after installation', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try it with sample data' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · cleaner ready')).toBeAttached();
  await expect(page.getByText('3 rows kept')).toBeVisible();
});

test('shows the first action, explanation, and all three facts inside a 1366 by 768 cold viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  for (const locator of [
    page.getByRole('link', { name: 'Try it with sample data' }),
    page.getByText('See a cleaned copy immediately.'),
    page.getByText('Opens CSV and Apple Health XML'),
    page.getByText('Health records stay in this browser tab'),
    page.getByText('Works offline after the first visit')
  ]) {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 769) + (box?.height ?? 0)).toBeLessThanOrEqual(768);
  }
});

test('serves the styled offline fallback for an uncached route without inline CSP-blocked CSS', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto('/uncached-offline-route');
  await expect(page).toHaveTitle('Offline — Health Export Cleaner');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The bench is still here.');
  await expect(page.locator('link[href="/offline.css"]')).toHaveCount(1);
  expect(await page.locator('style').count()).toBe(0);
});

test('declares route metadata, social preview, image provenance disclosure, and a visible build identity', async ({ page }) => {
  const routes = [
    { path: '/', title: 'Health Export Cleaner — minimize health files locally', canonical: '/' },
    { path: '/demo', title: 'Demo — Health Export Cleaner', canonical: '/demo' },
    { path: '/privacy/', title: 'Privacy — Health Export Cleaner', canonical: '/privacy/' },
    { path: '/terms/', title: 'Terms — Health Export Cleaner', canonical: '/terms/' },
    { path: '/404.html', title: 'Page not found — Health Export Cleaner', canonical: '/404.html' }
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://health-export-cleaner.sociobot.in${route.canonical}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^.{1,155}$/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /health-export-cleaner-social\.jpg$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('footer')).toContainText('v1.0.3');
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
  }
  await page.goto('/');
  await expect(page.locator('footer')).toContainText('Illustration generated for this product');
});

test('uses shared route chrome and restores heading focus through Privacy, Terms, back, forward, and 404', async ({ page }) => {
  await page.goto('/');
  const expectedPrimary = ['Demo', 'Privacy', 'Terms'];
  const expectedFooter = ['Demo', 'Privacy', 'Terms', 'Source code on GitHub (external site)'];
  for (const path of ['/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(path);
    await expect(page.locator('.wordmark .wordmark-mark')).toHaveText('H//');
    await expect(page.locator('.wordmark span').last()).toHaveText('Health Export Cleaner');
    await expect(page.locator('.site-nav a')).toHaveText(expectedPrimary);
    await expect(page.locator('footer nav a')).toHaveText(expectedFooter);
    await expect(page.locator('footer')).toContainText('Clean a health export before you share it.');
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
  }

  await page.goto('/');
  await page.locator('.site-nav').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Privacy');
  await page.locator('.site-nav').getByRole('link', { name: 'Terms' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('This page is not on the bench');
});

test('@claim:update-ready announces and activates an available service-worker update', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js?update-regression=1', { scope: '/' }));
  await expect(page.locator('#update-toast')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Refresh now' }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('button', { name: 'Try it with sample data' })).toBeVisible();
});

test('is usable at a 390px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByRole('button', { name: /Download cleaned copy/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const targets = page.locator('.wordmark, footer nav a');
  for (let index = 0; index < await targets.count(); index += 1) {
    const box = await targets.nth(index).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByRole('link', { name: 'H// Health Export Cleaner' })).toBeVisible();
});

test('@claim:designed-404 declares a styled 404 response instead of rewriting unknown URLs to the app', async ({ page }) => {
  const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8')) as { navigationFallback?: unknown; routes?: Array<{ route?: string; rewrite?: string }>; responseOverrides?: Record<string, { rewrite?: string; statusCode?: number }> };
  expect(config.navigationFallback).toBeUndefined();
  expect(config.routes).toContainEqual({ route: '/demo', rewrite: '/index.html' });
  expect(config.responseOverrides?.['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is not on the bench');
  await expect(page.getByRole('link', { name: 'Go to Health Export Cleaner' })).toHaveAttribute('href', '/');
});

test('assigns immutable caching only to content-hashed compiled assets', async () => {
  const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8')) as {
    routes: Array<{ route: string; headers?: Record<string, string> }>;
  };
  expect(config.routes).toContainEqual({
    route: '/compiled/*',
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }
  });
  expect(config.routes).toContainEqual({
    route: '/assets/*',
    headers: { 'Cache-Control': 'public, max-age=3600, must-revalidate' }
  });
  const html = await readFile('dist/index.html', 'utf8');
  expect(html).toMatch(/(?:src|href)="\/compiled\/[^"]+-[A-Za-z0-9_-]+\.(?:js|css)"/);
});
