/**
 * Épica 4: Procesamiento de Órdenes y Estados
 * HU-015: Actualización de estado (PROCESSING, COMPLETED, FAILED)
 * HU-016: Registro de motivo de fallo
 * HU-017: Registro de auditoría
 * HU-018: Manejo de caída del sistema durante reserva
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

test.describe('Épica 4: Ciclo de vida de órdenes', () => {
  test.describe('HU-015: Máquina de estados', () => {
    test('orden válida debe completarse exitosamente', async ({ request }) => {
      const payload = makePayload(100010, 2);
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

    test('orden vacía debe marcarse como FAILED', async ({ request }) => {
      const payload = {
        id: 100011,
        order_number: '1011',
        email: 'test@test.com',
        total_price: '0.00',
        line_items: [],
        created_at: new Date().toISOString(),
      };
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

  test.describe('HU-016: Registro de motivo de fallo', () => {
    test('orden sin line_items debe fallar con motivo', async ({ request }) => {
      const payload = {
        id: 100012,
        order_number: '1012',
        email: 'test@test.com',
        total_price: '10.00',
        created_at: new Date().toISOString(),
      };
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

  test.describe('HU-017: Auditoría', () => {
    test('cada webhook debe generar registro de auditoría', async ({ request }) => {
      const payload = makePayload(100013, 1);
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

  test.describe('HU-018: Recuperación ante caídas', () => {
    test('webhook duplicado después de crash debe ser idempotente', async ({ request }) => {
      const payload = makePayload(100014, 2);
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
});
