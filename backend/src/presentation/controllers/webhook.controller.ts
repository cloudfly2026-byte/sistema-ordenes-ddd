import { Controller, Post, Headers, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopifyHmacGuard } from '../guards/shopify-hmac.guard';
import { SyncShopifyOrderUseCase } from '../../application/use-cases/sync-shopify-order/sync-shopify-order.use-case';
import { SyncShopifyProductUseCase } from '../../application/use-cases/sync-shopify-product/sync-shopify-product.use-case';
import { WebhookEvent } from '../../infrastructure/database/entities/webhook-event.entity';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly syncShopifyOrderUseCase: SyncShopifyOrderUseCase,
    private readonly syncShopifyProductUseCase: SyncShopifyProductUseCase,
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepo: Repository<WebhookEvent>,
  ) {}

  @Post('shopify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ShopifyHmacGuard)
  async handleShopifyWebhook(
    @Headers('x-shopify-hmac-sha256') _hmac: string,
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-event-id') shopifyEventId: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    this.logger.log(`Received Shopify webhook: ${topic} (event: ${shopifyEventId})`);

    // Idempotency: insert into webhook_events with ON CONFLICT DO NOTHING
    if (shopifyEventId) {
      try {
        const result = await this.webhookEventRepo
          .createQueryBuilder()
          .insert()
          .into(WebhookEvent)
          .values({
            shopifyEventId,
            topic,
            shopDomain: shopDomain ?? 'unknown',
            payload,
            status: 'PENDING',
          })
          .orIgnore()
          .execute();

        // If no row was inserted (conflict), this is a duplicate
        if (result.raw?.length === 0) {
          this.logger.log(`Duplicate webhook event: ${shopifyEventId}`);
          return { received: true, duplicate: true };
        }
      } catch (error) {
        this.logger.error(`Error recording webhook event: ${error.message}`);
      }
    }

    try {
      switch (topic) {
        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
          await this.syncShopifyOrderUseCase.execute(payload);
          break;

        case 'products/create':
        case 'products/update':
          await this.syncShopifyProductUseCase.execute(payload);
          break;

        default:
          this.logger.log(`Unhandled webhook topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook ${topic}: ${error.message}`);
    }

    return { received: true };
  }
}
