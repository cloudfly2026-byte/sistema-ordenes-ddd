/**
 * ÉPICA 1: Integración con Shopify Webhooks
 * HU-001 a HU-005: Recepción, validación y procesamiento de webhooks
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

function makePayload(orderId: number, numItems = 2, fragile = false) {
  const items = [];
  for (let i = 0; i < numItems; i++) {
    items.push({
      id: 1000 + i,
      product_id: 2000 + i,
      variant_id: 3000 + i,
      sku: `SKU-${orderId}-${i}`,
      title: `Producto ${i + 1}`,
      quantity: 1,
      properties: fragile ? [{ name: 'fragile', value: 'true' }] : [],
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

test.describe('Épica 1: Integración con Shopify Webhooks', () => {
  test.describe('HU-001: Recepción de webhook', () => {
    test('debe aceptar un webhook válido y responder 200 OK', async ({ request }) => {
      const payload = makePayload(100001);
      const hmac = generateHmac(payload);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.received).toBe(true);
    });

    test('debe responder en menos de 500ms', async ({ request }) => {
      const payload = makePayload(100002);
      const hmac = generateHmac(payload);
      const start = Date.now();
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      const elapsed = Date.now() - start;
      expect(res.status()).toBe(200);
      expect(elapsed).toBeLessThan(500);
    });
  });

  test.describe('HU-002: Validación HMAC', () => {
    test('debe rechazar webhook con HMAC inválido → 401', async ({ request }) => {
      const payload = makePayload(200001);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': 'firma-invalida-abc123',
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect(res.status()).toBe(401);
    });

    test('debe rechazar webhook sin header HMAC → 401', async ({ request }) => {
      const payload = makePayload(200002);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect(res.status()).toBe(401);
    });

    test('debe rechazar webhook con HMAC vacío → 401', async ({ request }) => {
      const payload = makePayload(200003);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': '',
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('HU-003: Extracción de datos', () => {
    test('debe procesar webhook con múltiples productos', async ({ request }) => {
      const payload = makePayload(300001, 5);
      const hmac = generateHmac(payload);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect(res.status()).toBe(200);
    });

    test('debe procesar webhook con productos frágiles', async ({ request }) => {
      const payload = makePayload(300002, 1, true);
      const hmac = generateHmac(payload);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect(res.status()).toBe(200);
    });
  });

  test.describe('HU-004: Webhooks duplicados', () => {
    test('debe responder 200 a webhook duplicado (idempotencia)', async ({ request }) => {
      const payload = makePayload(400001);
      const hmac = generateHmac(payload);
      const headers = {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-SHA256': hmac,
        'X-Shopify-Topic': 'orders/create',
      };
      const res1 = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload, headers,
      });
      const res2 = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload, headers,
      });
      expect(res1.status()).toBe(200);
      expect(res2.status()).toBe(200);
    });
  });

  test.describe('HU-005: Formato inválido', () => {
    test('debe manejar body vacío sin crash', async ({ request }) => {
      const hmac = generateHmac({});
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: {},
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect([200, 400]).toContain(res.status());
    });

    test('debe manejar payload sin line_items', async ({ request }) => {
      const payload = { id: 500001, order_number: '1001', email: 'test@test.com', total_price: '10.00' };
      const hmac = generateHmac(payload);
      const res = await request.post(`${API_URL}/api/v1/webhooks/shopify`, {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-SHA256': hmac,
          'X-Shopify-Topic': 'orders/create',
        },
      });
      expect([200, 400]).toContain(res.status());
    });
  });
});
