import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OrderQueueProducer {
  private readonly logger = new Logger(OrderQueueProducer.name);

  constructor(
    @InjectQueue('order-processing') private readonly queue: Queue,
  ) {}

  async enqueue(orderId: string, payload: Record<string, unknown>): Promise<void> {
    await this.queue.add('process-order', { orderId, payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
    this.logger.log(`Order ${orderId} enqueued for processing`);
  }
}

