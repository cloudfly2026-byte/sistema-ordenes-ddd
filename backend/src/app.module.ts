import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { StructuredLogger } from './shared/logger/structured-logger.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisCacheService } from './infrastructure/cache/redis-cache.service';
import { CircuitBreakerService } from './infrastructure/circuit-breaker/circuit-breaker.service';

import { WebhookController } from './presentation/controllers/webhook.controller';
import { OrdersController } from './presentation/controllers/orders.controller';
import { InventoryController } from './presentation/controllers/inventory.controller';
import { ShopifyHmacGuard } from './presentation/guards/shopify-hmac.guard';
import { IdempotencyInterceptor } from './presentation/interceptors/idempotency.interceptor';

import { GetInventoryStatusUseCase } from './application/use-cases/get-inventory-status/get-inventory-status.use-case';
import { SyncShopifyOrderUseCase } from './application/use-cases/sync-shopify-order/sync-shopify-order.use-case';
import { SyncShopifyProductUseCase } from './application/use-cases/sync-shopify-product/sync-shopify-product.use-case';

import { InventoryDomainService } from './domain/inventory/services/inventory.domain-service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TerminusModule,
    DatabaseModule,
    QueueModule,
  ],
  controllers: [
    WebhookController,
    OrdersController,
    InventoryController,
  ],
  providers: [
    StructuredLogger,
    RedisCacheService,
    CircuitBreakerService,
    ShopifyHmacGuard,
    IdempotencyInterceptor,
    GetInventoryStatusUseCase,
    SyncShopifyOrderUseCase,
    SyncShopifyProductUseCase,
    InventoryDomainService,
  ],
})
export class AppModule {}