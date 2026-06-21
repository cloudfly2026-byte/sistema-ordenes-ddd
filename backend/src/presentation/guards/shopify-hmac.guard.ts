import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ShopifyHmacGuard implements CanActivate {
  private readonly logger = new Logger(ShopifyHmacGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const hmac = request.headers['x-shopify-hmac-sha256'] as string;
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? '';

    if (!hmac) {
      this.logger.warn('Missing HMAC signature');
      throw new UnauthorizedException('Missing HMAC signature');
    }

    const rawBody = JSON.stringify(request.body);
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computedHmac))) {
      return true;
    }

    this.logger.warn('Invalid HMAC signature');
    throw new UnauthorizedException('Invalid HMAC signature');
  }
}

