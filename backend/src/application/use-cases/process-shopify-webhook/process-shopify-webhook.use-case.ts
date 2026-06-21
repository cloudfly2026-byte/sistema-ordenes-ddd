import { Injectable, Logger } from '@nestjs/common';
import { ProcessShopifyWebhookDto } from './process-shopify-webhook.dto';

@Injectable()
export class ProcessShopifyWebhookUseCase {
  private readonly logger = new Logger(ProcessShopifyWebhookUseCase.name);

  async execute(dto: ProcessShopifyWebhookDto): Promise<void> {
    this.logger.log(`Processing Shopify webhook: ${dto.topic}`);
    const { topic, payload } = dto;

    if (topic === 'orders/create') {
      const orderId = payload['id'] as string;
      this.logger.log(`New order received: ${orderId}`);
    }
  }
}

