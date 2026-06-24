/**
 * HU5 — Panel Operativo y Compatibilidad Legacy
 *
 * Tests E2E del componente PHP legacy:
 *   - Consulta de materiales con bajo inventario
 *   - Formato de respuesta según especificación del reto
 *   - Health check
 *
 * Formato esperado (según reto):
 *   [
 *     { "material": "BOX_SMALL", "stock": 5 }
 *   ]
 */
import { test, expect } from '@playwright/test';

const LEGACY_URL = process.env.LEGACY_URL || 'http://localhost:8081';

test.describe('HU5 — Endpoint Legacy PHP', () => {

  // ── GET /materiales-bajo-stock.php ────────────────────────────────
  test.describe('GET /materiales-bajo-stock.php', () => {
    test('debe retornar 200 con Content-Type application/json', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const contentType = res.headers()['content-type'] || '';
      expect(contentType).toContain('application/json');
    });

    test('debe retornar un array JSON', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('cada elemento debe tener "material" y "stock" (formato del reto)', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      for (const item of body) {
        expect(item).toHaveProperty('material');
        expect(item).toHaveProperty('stock');
        expect(typeof item.material).toBe('string');
        expect(typeof item.stock).toBe('number');
      }
    });

    test('los materiales listados deben ser códigos válidos del inventario', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      const validMaterials = ['BOX_SMALL', 'BOX_MEDIUM', 'BOX_LARGE', 'LABEL', 'TAPE', 'FILLER'];

      for (const item of body) {
        expect(validMaterials).toContain(item.material);
      }
    });

    test('el stock debe ser un número entero no negativo', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      for (const item of body) {
        expect(item.stock).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(item.stock)).toBe(true);
      }
    });

    test('el array puede estar vacío si no hay materiales bajo stock', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      // No falla si está vacío — es un estado válido
      expect(Array.isArray(body)).toBe(true);
    });

    test('respuesta de ejemplo coincide con formato del reto', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/materiales-bajo-stock.php`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      // Si hay resultados, verificar el formato exacto del ejemplo del reto
      if (body.length > 0) {
        const example = body[0];
        // Debe tener SOLO las propiedades "material" y "stock"
        const keys = Object.keys(example).sort();
        expect(keys).toEqual(['material', 'stock']);
      }
    });
  });

  // ── Health Check ──────────────────────────────────────────────────
  test.describe('Health Check', () => {
    test('GET /health.php debe responder 200 o 503', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/health.php`);
      expect([200, 503]).toContain(res.status());
    });

    test('health check debe incluir status y db', async ({ request }) => {
      const res = await request.get(`${LEGACY_URL}/health.php`);
      if (res.status() === 200 || res.status() === 503) {
        const body = await res.json();
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('db');
      }
    });
  });
});
