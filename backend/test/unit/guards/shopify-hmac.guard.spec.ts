import { ShopifyHmacGuard } from '../../../src/presentation/guards/shopify-hmac.guard';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

const realCrypto = jest.requireActual('crypto') as typeof crypto;

// ── Mock crypto BEFORE importing the guard so the spy is in place ──
const SECRET = 'test-secret';
const mockCreateHmac = {
  update: jest.fn().mockReturnThis(),
  digest: jest.fn(),
};

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHmac: jest.fn(() => mockCreateHmac),
  timingSafeEqual: jest.fn((a: Buffer, b: Buffer) => {
    if (a.length !== b.length) return false;
    return a.equals(b);
  }),
}));

// Computes the HMAC the guard SHOULD produce, using the real (unmocked)
// crypto module — used as the expected value, never as the call under test.
function computeRealHmac(rawBody: string, secret: string): string {
  return realCrypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
}

describe('ShopifyHmacGuard', () => {
  let guard: ShopifyHmacGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ShopifyHmacGuard();
    process.env.SHOPIFY_WEBHOOK_SECRET = SECRET;
  });

  // ── HU1: Validar que el guard está definido ──────────────────────
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ── HU1: HMAC válido → canActivate retorna true ──────────────────
  it('should return true for a valid HMAC signature', () => {
    const payload = { id: 123, order_number: '1001' };
    const rawBody = JSON.stringify(payload);

    // Compute the expected HMAC with the REAL crypto module (not the mock)
    const validHmac = computeRealHmac(rawBody, SECRET);

    // Make the mocked createHmac().update().digest() return that same value,
    // simulating the guard re-computing an HMAC that matches the header
    mockCreateHmac.digest.mockReturnValue(validHmac);

    const request = {
      headers: { 'x-shopify-hmac-sha256': validHmac },
      body: payload,
      rawBody,
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(crypto.createHmac).toHaveBeenCalledWith('sha256', SECRET);
    expect(mockCreateHmac.update).toHaveBeenCalledWith(rawBody, 'utf8');
    expect(mockCreateHmac.digest).toHaveBeenCalledWith('base64');
  });

  // ── HU1: HMAC inválido → UnauthorizedException ───────────────────
  it('should throw UnauthorizedException for an invalid HMAC signature', () => {
    const payload = { id: 456 };
    const rawBody = JSON.stringify(payload);

    // Mock returns a DIFFERENT hmac than the one in the header
    mockCreateHmac.digest.mockReturnValue('invalid-hmac-value');

    const request = {
      headers: { 'x-shopify-hmac-sha256': 'tampered-hmac' },
      body: payload,
      rawBody,
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid HMAC signature');
  });

  // ── HU1: Header HMAC ausente → UnauthorizedException ─────────────
  it('should throw UnauthorizedException when HMAC header is missing', () => {
    const request = {
      headers: {},
      body: {},
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Missing HMAC signature');
  });

  // ── HU1: HMAC con longitud diferente → UnauthorizedException ─────
  it('should throw UnauthorizedException when HMAC length differs from computed', () => {
    const payload = { id: 789 };
    const rawBody = JSON.stringify(payload);

    // Return a very short hmac so length check fails
    mockCreateHmac.digest.mockReturnValue('short');

    const request = {
      headers: { 'x-shopify-hmac-sha256': 'this-is-a-very-long-hmac-value-that-wont-match' },
      body: payload,
      rawBody,
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  // ── HU1: Usa request.body cuando rawBody no está disponible ─────
  it('should fall back to JSON.stringify(body) when rawBody is not available', () => {
    const payload = { id: 999 };
    const rawBody = JSON.stringify(payload);

    const validHmac = computeRealHmac(rawBody, SECRET);

    mockCreateHmac.digest.mockReturnValue(validHmac);

    const request = {
      headers: { 'x-shopify-hmac-sha256': validHmac },
      body: payload,
      // no rawBody property
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    const result = guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockCreateHmac.update).toHaveBeenCalledWith(rawBody, 'utf8');
  });

  // ── HU1: Secret vacío → aún así calcula HMAC (no crashea) ───────
  it('should not crash when SHOPIFY_WEBHOOK_SECRET is empty', () => {
    process.env.SHOPIFY_WEBHOOK_SECRET = '';
    const payload = { id: 111 };
    const rawBody = JSON.stringify(payload);

    const validHmac = computeRealHmac(rawBody, '');

    mockCreateHmac.digest.mockReturnValue(validHmac);

    const request = {
      headers: { 'x-shopify-hmac-sha256': validHmac },
      body: payload,
      rawBody,
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
});
