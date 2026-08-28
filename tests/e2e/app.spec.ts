import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
});
