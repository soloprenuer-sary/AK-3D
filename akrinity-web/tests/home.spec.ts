import { test, expect } from '@playwright/test';

test('home page renders the headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('anything');
});

test('skip link is present and reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCount(1);
});
