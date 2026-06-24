import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProcessOrderUseCase } from '../../../application/use-cases/process-order/process-order.use-case';

@Processor('order-processing')
export class OrderQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderQueueConsumer.name);

  constructor(
    private readonly processOrderUseCase: ProcessOrderUseCase,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string; payload: Record<string, unknown> }>): Promise<void> {
    const { orderId } = job.data;
    this.logger.log(`Processing order ${orderId} (attempt ${job.attemptsMade + 1})`);
    await this.processOrderUseCase.execute(orderId);
  }
}
