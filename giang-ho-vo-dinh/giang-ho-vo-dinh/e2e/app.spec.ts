import { test, expect } from '@playwright/test';

test('loads the mobile-first game shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('GIANG HỒ VÔ ĐỊNH')).toBeVisible();
  await expect(page.getByPlaceholder(/viết hành động/i)).toBeVisible();
  await expect(page.getByText('Thế giới')).toBeVisible();
});

test('creates a character from a preset', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tạo nhân vật')).toBeVisible();
  await page.getByRole('button', { name: /Lữ khách/i }).click();
  await page.getByRole('button', { name: /Bắt đầu/i }).click();
  await expect(page.getByText('Thế giới')).toBeVisible();
  await expect(page.getByText('Luyện Thể')).toBeVisible();
});
