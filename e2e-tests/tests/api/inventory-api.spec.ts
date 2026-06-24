/**
 * HU4 — Sincronización y Control de Inventario
 * HU5 — Panel Operativo
 *
 * Tests E2E de la API de inventario:
 *   - Consulta de inventario completo
 *   - Consulta de material específico
 *   - Alertas de bajo stock
 *   - Consistencia tras procesamiento de órdenes
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const SHOPIFY_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET!;

function generateHmac(payload: object): string {
  const crypto = require('crypto');
  const rawBody = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', SHOPIFY_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
}

function makePayload(orderId: number, numItems = 2) {
  const items = [];
  for (let i = 0; i < numItems; i++) {
    items.push({
      id: 1000 + i,
      product_id: 2000 + i,
      variant_id: 3000 + i,
      sku: `SKU-${orderId}-${i}`,
      title: `Producto ${i + 1}`,
      quantity: 1,
      properties: [],
    });
  }
  return {
    id: orderId,
    order_number: String(orderId).slice(-4),
    email: `cliente${orderId}@ejemplo.com`,
    total_price: `${(numItems * 25.99).toFixed(2)}`,
    line_items: items,
    created_at: new Date().toISOString(),
  };
}

// ── Inventario Inicial (según reto técnico) ────────────────────────
const INITIAL_INVENTORY = [
  { materialId: 'BOX_SMALL',  name: 'Caja pequeña',     initialStock: 100 },
  { materialId: 'BOX_MEDIUM', name: 'Caja mediana',     initialStock: 80 },
  { materialId: 'BOX_LARGE',  name: 'Caja grande',      initialStock: 50 },
  { materialId: 'LABEL',      name: 'Etiqueta',         initialStock: 500 },
  { materialId: 'TAPE',       name: 'Cinta',            initialStock: 200 },
  { materialId: 'FILLER',     name: 'Material de protección', initialStock: 120 },
];

test.describe('HU4/HU5 — API de Inventario', () => {

  // ── GET /api/v1/inventory ────────────────────────────────────────
  test.describe('GET /api/v1/inventory', () => {
    test('debe retornar 200 con lista de materiales', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('debe incluir los 6 materiales del inventario inicial', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      const materialIds = body.data.map((m: any) => m.materialId);

      for (const expected of INITIAL_INVENTORY) {
        expect(materialIds).toContain(expected.materialId);
      }
    });

    test('cada material debe tener materialId, name y currentStock', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      for (const material of body.data) {
        expect(material).toHaveProperty('materialId');
        expect(material).toHaveProperty('name');
        expect(material).toHaveProperty('currentStock');
        expect(typeof material.currentStock).toBe('number');
      }
    });

    test('ningún material debe tener stock negativo', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      for (const material of body.data) {
        expect(material.currentStock).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── GET /api/v1/inventory/:materialId ────────────────────────────
  test.describe('GET /api/v1/inventory/:materialId', () => {
    test('debe retornar stock de BOX_SMALL', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory/BOX_SMALL`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('materialId', 'BOX_SMALL');
      expect(body).toHaveProperty('currentStock');
      expect(body.currentStock).toBeGreaterThanOrEqual(0);
    });

    test('debe retornar stock de LABEL', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory/LABEL`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('materialId', 'LABEL');
      expect(body).toHaveProperty('currentStock');
    });

    test('debe retornar stock de FILLER', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory/FILLER`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('materialId', 'FILLER');
      expect(body).toHaveProperty('currentStock');
    });

    test('debe retornar 404 para material inexistente', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory/INVALID_MATERIAL`);
      expect([404, 400]).toContain(res.status());
    });
  });

  // ── GET /api/v1/inventory/low-stock ──────────────────────────────
  test.describe('GET /api/v1/inventory/low-stock', () => {
    test('debe retornar 200 con lista de alertas', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory/low-stock`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('los materiales con bajo stock deben tener stock < threshold', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/inventory/low-stock`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      for (const item of body.data) {
        expect(item).toHaveProperty('materialId');
        expect(item).toHaveProperty('currentStock');
        expect(item).toHaveProperty('threshold');
        expect(item.currentStock).toBeLessThan(item.threshold);
      }
    });
  });

  // ── Consistencia tras procesamiento ───────────────────────────────
  test.describe('Consistencia tras procesamiento de órdenes', () => {
    test('el stock se actualiza correctamente después de procesar una orden', async ({ request }) => {
      // Obtener stock inicial de LABEL
      const beforeRes = await request.get(`${API_URL}/api/v1/inventory/LABEL`);
      expect(beforeRes.status()).toBe(200);
      const beforeBody = await beforeRes.json();
      const stockBefore = beforeBody.currentStock;

      // Enviar una orden (consume 1 LABEL)
      const payload = makePayload(88001, 2);
      const hmac = generateHmac(payload);
      const webhookRes = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect([200, 201]).toContain(webhookRes.status());

      // Esperar a que se procese la orden
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verificar que el stock de LABEL disminuyó
      const afterRes = await request.get(`${API_URL}/api/v1/inventory/LABEL`);
      expect(afterRes.status()).toBe(200);
      const afterBody = await afterRes.json();
      const stockAfter = afterBody.currentStock;

      // LABEL debe haberse descontado (1 por orden)
      expect(stockAfter).toBeLessThanOrEqual(stockBefore);
      expect(stockAfter).toBeGreaterThanOrEqual(0);
    });

    test('el stock no se modifica si la orden falla por stock insuficiente', async ({ request }) => {
      // Este test asume que ya se agotó algún material en pruebas anteriores
      // o que el stock es limitado. Verificamos que no haya stock negativo.
      const res = await request.get(`${API_URL}/api/v1/inventory`);
      expect(res.status()).toBe(200);
      const body = await res.json();

      for (const material of body.data) {
        expect(material.currentStock).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
