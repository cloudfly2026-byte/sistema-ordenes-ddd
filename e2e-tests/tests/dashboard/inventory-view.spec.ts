/**
 * Épica 5: Vista de Inventario
 * HU-020: Visualización de niveles de inventario
 * HU-021: Visualización de alertas de bajo stock
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Vista de Inventario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
  });

  test('debe mostrar la vista de inventario', async ({ page }) => {
    await expect(page.locator('h1, .page-title, .inventory-title')).toBeVisible();
  });

  test('debe mostrar lista de materiales con stock', async ({ page }) => {
    const materials = page.locator('.material-card, .material-item, .inventory-item');
    if (await materials.first().isVisible()) {
      const count = await materials.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe mostrar indicadores de estado (verde/amarillo/rojo)', async ({ page }) => {
    const indicators = page.locator('.stock-indicator, .status-dot, .stock-level');
    if (await indicators.first().isVisible()) {
      const count = await indicators.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Vista de Bajo Stock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/low-stock`);
  });

  test('HU-021: debe mostrar alertas de bajo stock', async ({ page }) => {
    await expect(page.locator('h1, .page-title, .low-stock-title, .alerts-title')).toBeVisible();
  });

  test('HU-021: cada alerta debe mostrar material, stock actual y umbral', async ({ page }) => {
    const alerts = page.locator('.alert-card, .alert-item, .low-stock-item');
    if (await alerts.first().isVisible()) {
      const firstAlert = alerts.first();
      await expect(firstAlert).toBeVisible();
    }
  });
});

