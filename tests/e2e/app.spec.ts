import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test('cleans a sample end to end and exposes removals before download', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Try a safe sample' }).click();
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
  await page.getByRole('button', { name: /Download clean package/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/cleaned-package\.zip$/);
});

test('locks verifier identifiers out and excludes their values from the downloaded CSV', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({
    name: 'verifier.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([
      'type,date,value,patientId,participantID,recordId,patientName,emailAddress,gpsCoordinates',
      'HeartRate,2026-08-28,72,P-123,S-456,R-789,Jane Doe,jane@example.test,"51.5,-0.1"'
    ].join('\n'))
  });
  await expect(page.getByText('Source ready')).toBeVisible();
  for (const field of ['patientId', 'participantID', 'recordId', 'patientName', 'emailAddress', 'gpsCoordinates']) {
    const row = page.locator('.field-list label').filter({ hasText: field });
    await expect(row.getByText('Always removed')).toBeVisible();
    await expect(row.locator('input')).toBeDisabled();
  }
  await expect(page.locator('#removed-fields-detail')).toHaveText('patientId, participantID, recordId, patientName, emailAddress, gpsCoordinates');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download clean package/ }).click();
  const entries = readStoredZip(await downloadBytes(await downloadPromise));
  const csv = entries.get('verifier-cleaned.csv') ?? '';
  expect(csv).toBe('type,date,value\r\nHeartRate,2026-08-28,72\r\n');
  expect(csv).not.toMatch(/P-123|S-456|R-789|Jane Doe|jane@example\.test|51\.5,-0\.1/);
});

test('keeps field labels, precision, receipt, and empty-state recovery in sync', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try a safe sample' }).click();
  const notes = page.locator('.field-list label').filter({ hasText: 'notes' });
  await notes.locator('input').uncheck();
  await expect(notes.getByText('Removed by you')).toBeVisible();
  await expect(page.locator('#removed-fields-detail')).toContainText('notes');

  const startDate = page.locator('.field-list label').filter({ hasText: 'startDate' });
  await expect(startDate.getByText('Kept · reduced to day')).toBeVisible();
  await page.getByRole('radio', { name: /Hour/ }).check();
  await expect(startDate.getByText('Kept · reduced to hour')).toBeVisible();
  await page.getByRole('radio', { name: /Exact/ }).check();
  await expect(startDate.getByText('Kept · exact timestamp')).toBeVisible();

  const available = page.locator('input[name="field"]:not(:disabled)');
  for (let index = 0; index < await available.count(); index += 1) await available.nth(index).uncheck();
  await expect(page.locator('#no-output')).toHaveText('No fields are selected. Select at least one available field to create a cleaned copy.');
  await expect(page.getByRole('button', { name: /Download clean package/ })).toBeDisabled();
});

test('has no serious accessibility violations in the empty and configured states', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Try a safe sample' }).click();
  await expect(page.getByText('Source ready')).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});

test('remains usable offline after installation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try a safe sample' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · cleaner ready')).toBeAttached();
  await page.getByRole('button', { name: 'Try a safe sample' }).click();
  await expect(page.getByText('3 rows kept')).toBeVisible();
});

test('is usable at a 390px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Try a safe sample' }).click();
  await expect(page.getByRole('button', { name: /Download clean package/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const targets = page.locator('.wordmark, footer nav a');
  for (let index = 0; index < await targets.count(); index += 1) {
    const box = await targets.nth(index).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByRole('link', { name: 'H// Health Export Cleaner home' })).toBeVisible();
});
