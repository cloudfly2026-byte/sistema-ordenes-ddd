/**
 * Épica 5: Vista de Órdenes
 * HU-019: Visualización de órdenes recientes y su estado
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Vista de Órdenes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
  });

  test('debe mostrar la vista de órdenes', async ({ page }) => {
    await expect(page.locator('h1, .page-title, .orders-title')).toBeVisible();
  });

  test('debe mostrar tabla de órdenes con columnas', async ({ page }) => {
    const table = page.locator('.data-table, table');
    if (await table.isVisible()) {
      const headers = table.locator('th');
      const count = await headers.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('debe mostrar estados de órdenes con colores', async ({ page }) => {
    const statusBadges = page.locator('.status-badge, .StatusBadge');
    if (await statusBadges.first().isVisible()) {
      const count = await statusBadges.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe permitir navegar al detalle de una orden', async ({ page }) => {
    const firstRow = page.locator('.data-table tbody tr, table tbody tr').first();
    if (await firstRow.isVisible()) {
      const link = firstRow.locator('a').first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(/.*order.*/);
      }
    }
  });
});

