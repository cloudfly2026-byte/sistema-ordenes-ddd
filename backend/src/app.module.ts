import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
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

import { ProcessShopifyWebhookUseCase } from './application/use-cases/process-shopify-webhook/process-shopify-webhook.use-case';
import { ProcessOrderUseCase } from './application/use-cases/process-order/process-order.use-case';
import { GetInventoryStatusUseCase } from './application/use-cases/get-inventory-status/get-inventory-status.use-case';

import { PackagingCalculatorDomainService } from './domain/order/services/packaging-calculator.domain-service';
import { InventoryDomainService } from './domain/inventory/services/inventory.domain-service';

import { Order } from './infrastructure/database/entities/order.entity';
import { OrderItem } from './infrastructure/database/entities/order-item.entity';
import { Material } from './infrastructure/database/entities/material.entity';
import { Inventory } from './infrastructure/database/entities/inventory.entity';
import { InventoryMovement } from './infrastructure/database/entities/inventory-movement.entity';
import { WebhookEvent } from './infrastructure/database/entities/webhook-event.entity';
import { OrderMaterial } from './infrastructure/database/entities/order-material.entity';
import { JobExecution } from './infrastructure/database/entities/job-execution.entity';
import { AuditLog } from './infrastructure/database/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'shopify_orders',
        entities: [
          Order, OrderItem, Material, Inventory,
          InventoryMovement, WebhookEvent, OrderMaterial,
          JobExecution, AuditLog,
        ],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          password: process.env.REDIS_PASSWORD ?? undefined,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'order-processing',
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
    ProcessShopifyWebhookUseCase,
    ProcessOrderUseCase,
    GetInventoryStatusUseCase,
    PackagingCalculatorDomainService,
    InventoryDomainService,
  ],
})
export class AppModule {}