import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderQueueProducer } from './producers/order-queue.producer';
import { OrderQueueConsumer } from './consumers/order-queue.consumer';
import { ProcessOrderUseCase } from '../../application/use-cases/process-order/process-order.use-case';
import { IOrderRepository } from '../../domain/order/repositories/order.repository.interface';
import { IInventoryRepository } from '../../domain/inventory/repositories/inventory.repository.interface';
import { PackagingCalculatorDomainService } from '../../domain/order/services/packaging-calculator.domain-service';
import { BoxSelectionPolicy } from '../../domain/order/policies/box-selection.policy';
import { OrderRepository } from '../database/repositories/order.repository';
import { InventoryRepository } from '../database/repositories/inventory.repository';
import { OrderEntity } from '../database/entities/order.entity';
import { OrderItemEntity } from '../database/entities/order-item.entity';
import { InventoryEntity } from '../database/entities/inventory.entity';
import { MaterialEntity } from '../database/entities/material.entity';
import { OrderMaterial } from '../database/entities/order-material.entity';
import { InventoryMovement } from '../database/entities/inventory-movement.entity';
import { WebhookEvent } from '../database/entities/webhook-event.entity';

const SharedTypeOrmModule = TypeOrmModule.forFeature([
  OrderEntity, OrderItemEntity, InventoryEntity, MaterialEntity,
  OrderMaterial, InventoryMovement, WebhookEvent,
]);

@Global()
@Module({
  imports: [
    SharedTypeOrmModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD', undefined),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'order-processing',
    }),
  ],
  providers: [
    OrderQueueProducer,
    OrderQueueConsumer,
    ProcessOrderUseCase,
    PackagingCalculatorDomainService,
    BoxSelectionPolicy,
    { provide: 'IOrderRepository', useClass: OrderRepository },
    { provide: 'IInventoryRepository', useClass: InventoryRepository },
  ],
  exports: [
    'IOrderRepository',
    'IInventoryRepository',
    BullModule,
    OrderQueueProducer,
    ProcessOrderUseCase,
    PackagingCalculatorDomainService,
    // Re-export the SAME forFeature() module instance so its repository
    // tokens (OrderEntity, MaterialEntity, InventoryEntity, etc.) are visible
    // to other modules (e.g. AppModule's use cases using @InjectRepository).
    // forFeature() providers are NOT automatically visible outside their
    // declaring module, even when that module is @Global() — only items
    // listed here in `exports` are.
    SharedTypeOrmModule,
  ],
})
export class QueueModule {}
