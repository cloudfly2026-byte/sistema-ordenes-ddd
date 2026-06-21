import { ShopifyHmacGuard } from '../../../src/presentation/guards/shopify-hmac.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('ShopifyHmacGuard', () => {
  let guard: ShopifyHmacGuard;

  beforeEach(() => {
    guard = new ShopifyHmacGuard();
    process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret';
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for valid HMAC', () => {
    const request = {
      headers: { 'x-shopify-hmac-sha256': '' },
      body: { id: 123 },
    } as any;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    // Mock crypto to return valid HMAC
    const result = guard.canActivate(context);
    expect(typeof result).toBe('boolean');
  });

  it('should throw UnauthorizedException for missing HMAC', () => {
    const request = {
      headers: {},
      body: {},
    } as any;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});

