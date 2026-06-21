import { Controller, Post, Headers, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ShopifyHmacGuard } from '../guards/shopify-hmac.guard';
import { ProcessShopifyWebhookUseCase } from '../../application/use-cases/process-shopify-webhook/process-shopify-webhook.use-case';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly processShopifyWebhookUseCase: ProcessShopifyWebhookUseCase,
  ) {}

  @Post('shopify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ShopifyHmacGuard)
  async handleShopifyWebhook(
    @Headers('x-shopify-hmac-sha256') _hmac: string,
    @Headers('x-shopify-topic') topic: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    this.logger.log(`Received Shopify webhook: ${topic}`);
    await this.processShopifyWebhookUseCase.execute({ topic, payload });
    return { received: true };
  }
}

