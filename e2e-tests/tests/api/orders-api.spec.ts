/**
 * ÉPICA 4: Gestión de Estado de Órdenes
 * HU-023 a HU-025: Máquina de estados, motivos de fallo, auditoría
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('Épica 4: API de Órdenes', () => {
  test('GET /api/v1/orders debe retornar lista de órdenes', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/orders`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/orders debe soportar paginación', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/orders?page=1&limit=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
  });

  test('GET /api/v1/orders debe soportar filtro por estado', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/orders?status=COMPLETED`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/orders/:id debe retornar orden específica', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/orders/test-id`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('status');
  });
});

