import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || 'smoke-admin@extractiq.local';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'ExtractIQSmoke!2026';
const INVITE_TOKEN = process.env.PLAYWRIGHT_INVITE_TOKEN || 'smoke-invite-token-2026';
const PROJECT_NAME = process.env.PLAYWRIGHT_PROJECT_NAME || 'Smoke Project';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/app/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
}

test.describe.configure({ mode: 'serial' });

test('website contact form submits successfully', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Full Name').fill('Smoke Contact');
  await page.getByLabel('Work Email').fill('contact-smoke@example.com');
  await page.getByLabel('Company').fill('Smoke Co');
  await page.getByLabel('Use case').fill('Local smoke verification');
  await page.getByRole('button', { name: /book a demo/i }).click();

  await expect(page.getByText("We'll be in touch within 24 hours.")).toBeVisible();
});

test('website demo form submits successfully', async ({ page }) => {
  await page.goto('/demo');
  await page.getByLabel('First Name *').fill('Demo');
  await page.getByLabel('Last Name *').fill('Requester');
  await page.getByLabel('Work Email *').fill('demo-smoke@example.com');
  await page.getByLabel('Company *').fill('Smoke Co');
  await page.getByRole('button', { name: /request demo/i }).click();

  await expect(page.getByText(/we'll be in touch within 24 hours/i)).toBeVisible();
});

test('operator login works at /app/login', async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByText('Dashboard')).toBeVisible();
});

test('invite acceptance completes account setup', async ({ page }) => {
  await page.goto(`/app/accept-invite?token=${INVITE_TOKEN}`);
  await expect(page.getByText('Smoke Workspace')).toBeVisible();

  await page.getByLabel('Password').fill('InviteSmokePass!2026');
  await page.getByLabel('Confirm password').fill('InviteSmokePass!2026');
  await page.getByRole('button', { name: /accept invitation/i }).click();

  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByText('Dashboard')).toBeVisible();
});

test('upload flow creates a job from the operator app', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/app/upload');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'playwright-upload.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 smoke upload'),
  });
  await page.getByRole('combobox').selectOption({ label: PROJECT_NAME });
  await page.getByRole('button', { name: /upload files/i }).click();
  await expect(page.getByText('uploaded')).toBeVisible();

  await page.getByRole('button', { name: /start extraction/i }).click();
  await page.goto('/app/jobs');
  await expect(page.getByText('playwright-upload.pdf')).toBeVisible();
});

test('review queue detail can flag a seeded review item', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/app/review');
  await page.getByText('What is the first cranial nerve responsible for smell?').click();

  await expect(page).toHaveURL(/\/app\/review\//);
  await expect(page.getByText('seeded-review.pdf')).toBeVisible();
  await page.getByRole('button', { name: /^flag$/i }).click();

  await page.goto('/app/review');
  await expect(page.getByText('No items found')).toBeVisible();
});

test('export history renders and completed exports open a download URL', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/app/export');
  await expect(page.getByText('Export History')).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /download/i }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded').catch(() => undefined);
  expect(popup.url()).toContain('localhost:9000');
});
