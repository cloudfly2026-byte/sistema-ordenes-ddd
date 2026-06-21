import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('order-processing')
export class OrderQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderQueueConsumer.name);

  async process(job: Job<{ orderId: string; payload: Record<string, unknown> }>): Promise<void> {
    const { orderId, payload } = job.data;
    this.logger.log(`Processing order ${orderId} (attempt ${job.attemptsMade + 1})`);
    // Processing logic handled by ProcessOrderUseCase
  }
}

