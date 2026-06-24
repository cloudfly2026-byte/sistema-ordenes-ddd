import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { WebhookController } from '../../../src/presentation/controllers/webhook.controller';

describe('WebhookController (Unit)', () => {
  const payload = { id: 123, line_items: [] };

  function createQueryBuilderMock(execute: jest.Mock) {
    return {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute,
    };
  }

  function createController(execute: jest.Mock) {
    const queryBuilder = createQueryBuilderMock(execute);
    const webhookEventRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const syncShopifyOrderUseCase = { execute: jest.fn() };
    const syncShopifyProductUseCase = { execute: jest.fn() };

    const controller = new WebhookController(
      syncShopifyOrderUseCase as any,
      syncShopifyProductUseCase as any,
      webhookEventRepo as any,
    );

    return {
      controller,
      queryBuilder,
      syncShopifyOrderUseCase,
      syncShopifyProductUseCase,
    };
  }

  it('rejects webhooks without Shopify event id before running business logic', async () => {
    const { controller, syncShopifyOrderUseCase } = createController(jest.fn());

    await expect(
      controller.handleShopifyWebhook('hmac', 'orders/create', '', 'shop.myshopify.com', payload),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(syncShopifyOrderUseCase.execute).not.toHaveBeenCalled();
  });

  it('stops processing when the webhook event cannot be recorded', async () => {
    const { controller, syncShopifyOrderUseCase } = createController(
      jest.fn().mockRejectedValue(new Error('database unavailable')),
    );

    await expect(
      controller.handleShopifyWebhook('hmac', 'orders/create', 'evt-1', 'shop.myshopify.com', payload),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(syncShopifyOrderUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns duplicate response without running business logic for duplicated events', async () => {
    const { controller, syncShopifyOrderUseCase } = createController(
      jest.fn().mockResolvedValue({ raw: [] }),
    );

    const response = await controller.handleShopifyWebhook(
      'hmac',
      'orders/create',
      'evt-1',
      'shop.myshopify.com',
      payload,
    );

    expect(response).toEqual({ received: true, duplicate: true });
    expect(syncShopifyOrderUseCase.execute).not.toHaveBeenCalled();
  });

  it('records the event before delegating order processing', async () => {
    const { controller, queryBuilder, syncShopifyOrderUseCase } = createController(
      jest.fn().mockResolvedValue({ raw: [{ id: 'webhook-event-id' }] }),
    );

    await expect(
      controller.handleShopifyWebhook('hmac', 'orders/create', 'evt-1', 'shop.myshopify.com', payload),
    ).resolves.toEqual({ received: true });

    expect(queryBuilder.values).toHaveBeenCalledWith({
      shopifyEventId: 'evt-1',
      topic: 'orders/create',
      shopDomain: 'shop.myshopify.com',
      payload,
      status: 'PENDING',
    });
    expect(syncShopifyOrderUseCase.execute).toHaveBeenCalledWith(payload);
  });
});
